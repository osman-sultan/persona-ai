import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, instructions, seed, categoryId } = body;

    if (!params.personaId) {
      return new NextResponse("Persona ID is required", {
        status: 400,
      });
    }

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

    const persona = await prismadb.persona.update({
      where: {
        id: params.personaId,
        userId: user.id,
      },
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
    console.log("[PERSONA__PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const persona = await prismadb.persona.delete({
      where: {
        userId,
        id: params.personaId,
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Persona Successfully Deleted!", persona }),
      { status: 200 }
    );
  } catch (error) {
    console.log("[PERSONA__DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
