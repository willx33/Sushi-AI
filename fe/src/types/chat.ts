// fe/src/types/chat.ts
export interface Message {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  model?: string;
  createdAt?: Date;
  imagePaths?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt?: Date;
  workspaceId: string; // Make required
  folderId?: string;
  model: string; // Make required
  systemPrompt?: string;
  temperature?: number;
  contextLength?: number;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  type: 'chats';
  createdAt: Date;
  updatedAt?: Date;
}