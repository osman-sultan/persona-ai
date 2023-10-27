import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import PersonaForm from "./components/persona-form";

interface PersonaIdPageProps {
  params: {
    personaId: string;
  };
}

const PersonaIdPage = async ({ params }: PersonaIdPageProps) => {
  // TODO: Check subscription

  const { userId } = auth();

  const persona = await prismadb.persona.findUnique({
    where: {
      id: params.personaId,
      userId: userId!,
    },
  });

  const categories = await prismadb.category.findMany();

  return <PersonaForm initialData={persona} categories={categories} />;
};

export default PersonaIdPage;
