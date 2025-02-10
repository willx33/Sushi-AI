// fe/src/components/chat/ChatWindow.tsx
import * as React from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Message } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => void;
  selectedModel: string;
  includeMemory: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  selectedModel,
  includeMemory,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Determine if a system message already exists.
  const initialSystemMessage =
    messages.length > 0 && messages[0].role === "system" ? messages[0].content : "";

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>
      <ChatInput
        onSendMessage={onSendMessage}
        model={selectedModel}
        includeMemory={includeMemory}
        initialSystemMessage={initialSystemMessage}
      />
    </div>
  );
};

export default ChatWindow;
