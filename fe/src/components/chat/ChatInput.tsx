// fe/src/components/chat/ChatInput.tsx
import React, { KeyboardEvent, useState } from "react";
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

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  model,
}) => {
  const [message, setMessage] = useState("");
  const limit = modelCharLimits[model] || 1000;

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
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
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y overflow-auto min-h-[2.5rem] max-h-32 pr-12"
      />
      <div
        className="text-xs text-right mt-1"
        style={{ color: message.length > limit ? "red" : "inherit" }}
      >
        {message.length}/{limit}
      </div>
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSend} disabled={disabled || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
export default ChatInput;
