// ./fe/src/components/chat/ChatMessage.tsx
import * as React from "react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} p-2`}>
      <div
        className={`max-w-3xl p-4 rounded-lg 
          ${
            isUser
              ? "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(0,128,128,0.1)]"
              : "bg-card text-card-foreground shadow-[0_0_0_1px_rgba(128,0,128,0.1)]"
          }`}
      >
        <div className="text-sm mb-1 font-medium">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
