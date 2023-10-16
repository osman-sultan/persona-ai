"use client";

import { Category, Persona } from "@prisma/client";

interface PersonaFormProps {
  initialData: Persona | null;
  categories: Category[];
}

const PersonaForm = ({ categories, initialData }: PersonaFormProps) => {
  return <div>hello</div>;
};

export default PersonaForm;
