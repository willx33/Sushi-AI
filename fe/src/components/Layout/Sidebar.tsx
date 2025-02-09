// src/components/layout/Sidebar.tsx
import React from 'react';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Chat } from '@/types/chat';

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
    <div className="w-64 h-screen bg-zinc-50 border-r border-zinc-200 p-4 flex flex-col">
      <Button
        onClick={onNewChat}
        className="w-full mb-4"
        variant="secondary"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <Button
            key={chat.id}
            variant={selectedChatId === chat.id ? "default" : "ghost"}
            className="w-full justify-start mb-2 truncate"
            onClick={() => onSelectChat(chat.id)}
          >
            {chat.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
