import prismadb from "@/lib/prismadb";
import PersonaForm from "./components/persona-form";

interface PersonaIdPageProps {
  params: {
    personaId: string;
  };
}

const PersonaIdPage = async ({ params }: PersonaIdPageProps) => {
  // TODO: Check subscription

  const persona = await prismadb.persona.findUnique({
    where: {
      id: params.personaId,
    },
  });

  const categories = prismadb.category.findMany();

  return <PersonaForm initialData={persona} categories={categories} />;
};

export default PersonaIdPage;
