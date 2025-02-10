import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import ModelSelector from "@/components/ModelSelector";
import { Chat, Message } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedChatId, setSelectedChatId] = useState<string>();
  // Initialize API key from localStorage.
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("apiKey") || "");
  // Set default selected model to "gpt-4o-mini" if none saved.
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selectedModel") || "gpt-4o-mini";
  });
  // State to control whether the sidebar is shown.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

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
        body: JSON.stringify({ message: content, model: selectedModel, apiKey }),
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
      {/* Sidebar wrapper */}
      <div className="relative">
        <div
          className="transition-all duration-300 bg-card border-r h-full overflow-hidden"
          style={{ width: sidebarOpen ? "16rem" : "2rem" }}
        >
          {sidebarOpen && (
            <>
              <ApiKeyInput onSave={setApiKey} initialKey={apiKey} />
              <ModelSelector
                selectedModel={selectedModel}
                onChange={setSelectedModel}
              />
              <Sidebar
                chats={chats}
                onNewChat={handleNewChat}
                onSelectChat={setSelectedChatId}
                selectedChatId={selectedChatId}
              />
            </>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="absolute top-1/2 right-[-1rem] transform -translate-y-1/2 bg-card border border-gray-300 rounded-full p-1 z-10"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
      {/* Main Chat Window */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow
            messages={selectedChat.messages}
            onSendMessage={handleSendMessage}
            selectedModel={selectedModel}
          />
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
