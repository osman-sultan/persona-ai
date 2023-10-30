import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import prismadb from "@/lib/prismadb";
import { rateLimit } from "@/lib/rate-limit";
import { currentUser } from "@clerk/nextjs";

import { LangChainStream, StreamingTextResponse } from "ai";
import { CallbackManager } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { Replicate } from "langchain/llms/replicate";
import { PromptTemplate } from "langchain/prompts";

import dotenv from "dotenv";
dotenv.config({ path: `.env` });

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
      modelName: "llama2-13b",
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

    let relevantHistory = "";
    if (!!similarDocs && similarDocs.length === 0) {
      relevantHistory = similarDocs.map(doc => doc.pageContent).join("\n");
    }

    console.log("RELEVANT HISTORY: ", relevantHistory);

    const { handlers } = LangChainStream();

    // Call Replicate for inference
    const model = new Replicate({
      model:
        "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      input: {
        max_length: 2048,
      },
      apiKey: process.env.REPLICATE_API_TOKEN,
      callbackManager: CallbackManager.fromHandlers(handlers),
    });

    // const model = new OpenAI({
    //   modelName: "gpt-3.5-turbo-16k",
    //   openAIApiKey: process.env.OPENAI_API_KEY,
    //   callbackManager: CallbackManager.fromHandlers(handlers),
    // });

    model.verbose = true;

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

    const chain = new LLMChain({
      llm: model,
      prompt: chainPrompt,
    });

    const initial_res = await chain
      .call({
        relevantHistory,
        recentChatHistory: recentChatHistory,
      })
      .catch(console.error);

    const res = initial_res!.text;

    var Readable = require("stream").Readable;
    let s = new Readable();
    s.push(res);
    s.push(null);

    if (res !== undefined && res.length > 1) {
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
    }

    return new StreamingTextResponse(s);
  } catch (error) {
    console.log("[CHAT_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
