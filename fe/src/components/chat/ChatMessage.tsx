// ./fe/src/components/chat/ChatMessage.tsx
import * as React from "react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isStreaming = false,
  streamingContent = ""
}) => {
  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent : message.content;

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
        <div className="text-sm mb-1 font-medium flex items-center">
          {isUser ? "You" : "Assistant"}
          {isStreaming && !isUser && (
            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {content}
          {isStreaming && !isUser && !content && (
            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full animate-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
