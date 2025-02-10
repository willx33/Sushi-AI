// fe/src/components/chat/ChatInput.tsx
import React, { KeyboardEvent, useState } from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => void;
  disabled?: boolean;
  model: string;
  includeMemory: boolean;
  // If a system message has already been set for this chat,
  // it is passed via initialSystemMessage.
  initialSystemMessage?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  model,
  includeMemory,
  initialSystemMessage = "",
}) => {
  const [message, setMessage] = useState("");
  // Only show the system instructions input if there isn’t already one.
  const [systemMessage, setSystemMessage] = useState<string>("");

  // Character limits for each model.
  const modelCharLimits: Record<string, number> = {
    "gpt-4o-mini": 1090,
    "gpt-3.5-turbo-16k": 6400,
    "gpt-3.5-turbo": 2560,
    "gpt-4-turbo-128k": 4096,
    "gpt-4-8k": 2048,
    "gpt-4-32k": 3072,
    "gpt-4o": 2048,
  };
  const limit = modelCharLimits[model] || 1000;

  const handleSend = () => {
    if (message.trim()) {
      // Pass the systemMessage only if there isn’t already an initial one.
      onSendMessage({
        message,
        includeMemory,
        systemMessage: !initialSystemMessage ? systemMessage : undefined,
      });
      setMessage("");
      setSystemMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-300 flex flex-col">
      {/* Only show the system instructions field if none exists for this chat */}
      {!initialSystemMessage && (
        <input
          type="text"
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="Optional system instructions (e.g. your chatbot’s persona)"
          className="mb-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y overflow-auto min-h-[2.5rem] max-h-32 pr-12"
      />
      <div className="mt-2 flex justify-end items-center gap-2">
        <div className="text-xs" style={{ color: message.length > limit ? "red" : "inherit" }}>
          {message.length}/{limit}
        </div>
        <Button onClick={handleSend} disabled={disabled || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
