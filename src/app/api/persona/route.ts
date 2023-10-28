import prismadb from "@/lib/prismadb";
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

    // TODO: Check for subscription

    const companion = await prismadb.persona.create({
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
      JSON.stringify({ message: "Persona Successfully Created!", companion }),
      { status: 201 }
    );
  } catch (error) {
    console.log("[COMPANION__POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
