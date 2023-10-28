import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BotAvatarProps {
  src: string;
}

export const BotAvatar = ({ src }: BotAvatarProps) => {
  return (
    <Avatar className="w-12 h-12">
      <AvatarImage src={src} />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
  );
};
