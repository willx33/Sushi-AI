// src/components/chat/ChatMessage.tsx
import React from 'react';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={`p-4 ${
        message.role === 'assistant'
          ? 'bg-zinc-50'
          : 'bg-white'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="font-medium mb-1">
          {message.role === 'assistant' ? 'Assistant' : 'You'}
        </div>
        <div className="text-zinc-700">{message.content}</div>
      </div>
    </div>
  );
};
