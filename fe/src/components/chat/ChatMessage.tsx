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
        className={`max-w-3xl p-4 rounded-lg shadow border ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground"
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