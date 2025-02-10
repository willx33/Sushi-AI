import React, { KeyboardEvent, useState } from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (payload: { message: string; systemMessage?: string }) => void;
  disabled?: boolean;
  model: string;
  isFirstMessage?: boolean;
}

const modelCharLimits: Record<string, number> = {
  "gpt-4o-mini": 1090,
  "gpt-3.5-turbo-16k": 6400,
  "gpt-3.5-turbo": 2560,
  "gpt-4": 2048,
  "gpt-4o": 2048,
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  model,
  isFirstMessage,
}) => {
  const [message, setMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const limit = modelCharLimits[model] || 1000;

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage({
        message,
        systemMessage: isFirstMessage && systemPrompt.trim() ? systemPrompt : undefined,
      });
      setMessage("");
      if (isFirstMessage) {
        setSystemPrompt("");
      }
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
      {isFirstMessage && (
        <div className="mb-2">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter system prompt (optional)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>
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
        <div
          className="text-xs"
          style={{ color: message.length > limit ? "red" : "inherit" }}
        >
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