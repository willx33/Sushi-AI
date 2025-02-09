// fe/src/components/Layout/Sidebar.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Chat } from "@/types/chat";

interface SidebarProps {
  chats: Chat[];
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  onNewChat,
  onSelectChat,
  selectedChatId,
}) => {
  return (
    <div className="flex flex-col p-4 space-y-2">
      <Button onClick={onNewChat} className="w-full" variant="secondary">
        <PlusCircle className="mr-2 h-5 w-5" />
        New Chat
      </Button>
      <div className="flex-1 overflow-y-auto mt-4">
        {chats.map((chat) => (
          <Button
            key={chat.id}
            variant={selectedChatId === chat.id ? "default" : "ghost"}
            className="w-full justify-start text-left mb-2"
            onClick={() => onSelectChat(chat.id)}
          >
            {chat.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
