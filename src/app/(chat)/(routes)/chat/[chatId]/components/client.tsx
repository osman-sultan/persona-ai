"use client";

import { ChatHeader } from "@/components/chat-header";
import { Message, Persona } from "@prisma/client";

interface ChatClientProps {
  persona: Persona & {
    messages: Message[];
    _count: {
      messages: number;
    };
  };
}

export const ChatClient = ({ persona }: ChatClientProps) => {
  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader persona={persona} />
    </div>
  );
};
