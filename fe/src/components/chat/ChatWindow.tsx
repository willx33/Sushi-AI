// fe/src/components/chat/ChatWindow.tsx
import * as React from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Message } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
}) => {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
      </ScrollArea>
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};
