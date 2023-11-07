import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import prismadb from "@/lib/prismadb";
import { rateLimit } from "@/lib/rate-limit";
import { currentUser } from "@clerk/nextjs";

import { ReplicateStream, StreamingTextResponse } from "ai";
import { PromptTemplate } from "langchain/prompts";
import Replicate from "replicate";

export const runtime = "edge";

// Create a Replicate API client (that's edge friendly!)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const persona = await prismadb.persona.update({
      where: {
        id: params.chatId,
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      },
    });

    if (!persona) {
      return new NextResponse("Persona not found", { status: 404 });
    }

    const name = persona.name;
    const persona_file_name = name + ".pine_cone";

    // create persona key for redis
    const personaKey = {
      personaName: name,
      userId: user.id,
      modelName: "llama2-70b-chat",
    };

    const memoryManager = await MemoryManager.getInstance();

    // if it's the first time talking to the persona, we need to seed the chat history
    const records = await memoryManager.readLatestHistory(personaKey);
    if (!records || records.length === 0) {
      await memoryManager.seedChatHistory(persona.seed, "\n\n", personaKey);
    }

    // write the new prompt to the chat history in the format of our seed!!
    await memoryManager.writeToHistory("User: " + prompt + "\n", personaKey);

    // Query Pinecone
    const recentChatHistory = await memoryManager.readLatestHistory(personaKey);

    // Right now the preamble is included in the similarity search, but that
    // shouldn't be an issue
    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      persona_file_name
    );

    console.log(similarDocs);

    let relevantHistory = "";
    if (!!similarDocs && similarDocs.length === 0) {
      relevantHistory = similarDocs.map(doc => doc.pageContent).join("\n");
    }

    console.log("RELEVANT HISTORY: ", relevantHistory);

    const chainPrompt = PromptTemplate.fromTemplate(
      `
      ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${persona.name}: prefix.

      You are ${persona.name} and are currently talking to ${currentUser.name}.

      ${persona.instructions}

      Below are relevant details about ${persona.name}'s past and the conversation you are in.
      ${relevantHistory}

      Below is a relevant conversation history
      ${recentChatHistory}\n${persona.name}
      `
    );

    console.log("chainPrompt: ", chainPrompt.template);

    const response = await replicate.predictions.create({
      stream: true,
      version:
        // 70b-chat
        //"2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1",
        //13b-chat
        "f4e2de70d66816a838a89eeeb621910adffb0dd0baba3976c96980970978018d",
      input: {
        prompt: chainPrompt.template,
      },
    });

    // Convert the response into a friendly text-stream
    const stream = await ReplicateStream(response, {
      onCompletion: async (res: string) => {
        memoryManager.writeToHistory("" + res.trim(), personaKey);

        // upsert it into the pinecone db
        const current_history = `${res.trim()}`;
        await memoryManager.UpsertChatHistory(
          recentChatHistory + "\n" + current_history,
          persona_file_name
        );

        await prismadb.persona.update({
          where: {
            id: params.chatId,
          },
          data: {
            messages: {
              create: {
                content: res,
                role: "system",
                userId: user.id,
              },
            },
          },
        });
      },
    });
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.log("[CHAT_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
