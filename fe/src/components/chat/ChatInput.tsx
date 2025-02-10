import React, { KeyboardEvent, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  model: string;
}

const modelCharLimits: Record<string, number> = {
  "gpt-4o-mini": 1090,
  "gpt-3.5-turbo-16k": 6400,
  "gpt-3.5-turbo": 2560,
  "gpt-4": 2048,
  "gpt-4o": 2048,
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, model }) => {
  const [message, setMessage] = useState("");
  const limit = modelCharLimits[model] || 1000;

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-300 flex flex-col">
      <div className="relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
        />
        <div
          className="absolute bottom-1 right-2 text-xs"
          style={{ color: message.length > limit ? "red" : "inherit" }}
        >
          {message.length}/{limit}
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSend} disabled={disabled || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
