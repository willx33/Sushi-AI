export interface Message {
    role: 'assistant' | 'user';
    content: string;
  }
  
  export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
  }