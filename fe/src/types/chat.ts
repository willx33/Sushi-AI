export interface Message {
  role: "assistant" | "user" | "system";
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
