// fe/src/App.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ModelSelector } from "@/components/ModelSelector";
import { Chat, Message } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem("selectedModel") || "gpt-3.5-turbo"
  );

  const { toast } = useToast();

  // Persist chats in local storage
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Fetch any saved API key from the backend on mount
  useEffect(() => {
    fetch("/api/apikey")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    setChats([newChat, ...chats]);
    setSelectedChatId(newChat.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatId || !apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter your OpenAI API key first",
        variant: "destructive",
      });
      return;
    }

    const newMessage: Message = { role: "user", content };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title,
            }
          : chat
      )
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the selected model in the API request
        body: JSON.stringify({ message: content, model: selectedModel }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        throw new Error("Failed to fetch response from the backend");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an issue communicating with the OpenAI API.",
        variant: "destructive",
      });
      console.error("Error fetching response:", error);
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-1/4 bg-card border-r">
        <ApiKeyInput onSave={setApiKey} initialKey={apiKey} />
        {/* New ModelSelector component */}
        <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
        <Sidebar
          chats={chats}
          onNewChat={handleNewChat}
          onSelectChat={setSelectedChatId}
          selectedChatId={selectedChatId}
        />
      </div>
      <div className="w-3/4">
        {selectedChat ? (
          <ChatWindow messages={selectedChat.messages} onSendMessage={handleSendMessage} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome to ChatGPT Clone</h1>
              <p className="text-muted-foreground">
                Start a new chat or select an existing one.
              </p>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
