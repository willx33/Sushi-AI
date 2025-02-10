// fe/src/App.tsx
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
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem("apiKey") || ""
  );
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selectedModel") || "gpt-4o-mini";
  });
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

  /**
   * Updated send message handler:
   * - Accepts a payload with { message, systemMessage? }.
   * - If the current chat is new (no messages yet) and a system prompt is provided,
   *   it adds the system prompt (role "system") before the user’s message.
   */
  const handleSendMessage = async (payload: { message: string; systemMessage?: string }) => {
    if (!selectedChatId || !apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter your OpenAI API key first",
        variant: "destructive",
      });
      return;
    }
    
    const { message, systemMessage } = payload;
    const newUserMessage: Message = { role: "user", content: message };

    // Update the chat locally.
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === selectedChatId) {
          if (chat.messages.length === 0 && systemMessage && systemMessage.trim() !== "") {
            return {
              ...chat,
              messages: [{ role: "system", content: systemMessage }, newUserMessage],
              title: message.slice(0, 30),
            };
          } else {
            return {
              ...chat,
              messages: [...chat.messages, newUserMessage],
              title: chat.messages.length === 0 ? message.slice(0, 30) : chat.title,
            };
          }
        }
        return chat;
      })
    );

    // Build conversation history to send to the backend.
    let conversation: Message[] = [];
    const currentChat = chats.find((chat) => chat.id === selectedChatId);
    if (currentChat) {
      // For a new chat, if a system prompt was provided, include it.
      if (currentChat.messages.length === 0 && systemMessage && systemMessage.trim() !== "") {
        conversation.push({ role: "system", content: systemMessage });
      }
      conversation = conversation.concat(currentChat.messages);
      conversation.push(newUserMessage);
    } else {
      // Fallback: if no chat found, simply include the user message (and system prompt if provided)
      if (systemMessage && systemMessage.trim() !== "") {
        conversation.push({ role: "system", content: systemMessage });
      }
      conversation.push(newUserMessage);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: conversation, model: selectedModel, apiKey }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        throw new Error("Failed to fetch response from the backend");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.response };

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