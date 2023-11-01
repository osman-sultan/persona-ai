import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, instructions, seed, categoryId } = body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (
      !src ||
      !name ||
      !description ||
      !instructions ||
      !seed ||
      !categoryId
    ) {
      return new NextResponse("Bad Request: Missing Required Fields", {
        status: 400,
      });
    }

    const isPro = await checkSubscription();

    if (!isPro) {
      return new NextResponse("Pro Subscription required", { status: 403 });
    }

    const persona = await prismadb.persona.create({
      data: {
        categoryId,
        userId: user.id,
        userName: user.firstName,
        src,
        name,
        description,
        instructions,
        seed,
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Persona Successfully Created!", persona }),
      { status: 201 }
    );
  } catch (error) {
    console.log("[PERSONA__POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
