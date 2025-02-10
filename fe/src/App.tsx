// fe/src/App.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import ModelSelector from "@/components/ModelSelector";
import { Chat, Message } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";

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
  const [includeMemory, setIncludeMemory] = useState<boolean>(() => {
    const stored = localStorage.getItem("includeMemory");
    return stored ? JSON.parse(stored) : true;
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : true;
  });

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // When creating a new chat, we start with an empty messages array.
  // (The system instructions will later be added via the ChatInput inline field.)
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
   * Updated send-message handler.
   * Now the payload includes an optional systemMessage.
   */
  const handleSendMessage = async (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => {
    if (!selectedChatId || !apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter your OpenAI API key in Settings first.",
        variant: "destructive",
      });
      return;
    }
    const { message, includeMemory, systemMessage } = payload;
    const newUserMessage: Message = { role: "user", content: message };

    // Find the current chat from state.
    const currentChat = chats.find((chat) => chat.id === selectedChatId) || {
      messages: [],
    };
    const isNewChat = currentChat.messages.length === 0;

    // Build the conversation that will be sent to the API.
    let conversation: Message[] = [];
    if (includeMemory) {
      if (isNewChat) {
        conversation = systemMessage?.trim()
          ? [{ role: "system", content: systemMessage }, newUserMessage]
          : [newUserMessage];
      } else {
        conversation = [...currentChat.messages, newUserMessage];
        // If the existing conversation does not begin with a system message, prepend a default.
        if (!currentChat.messages[0] || currentChat.messages[0].role !== "system") {
          conversation = [
            { role: "system", content: "You are a helpful assistant." },
            ...conversation,
          ];
        }
      }
    } else {
      conversation = systemMessage?.trim()
        ? [{ role: "system", content: systemMessage }, newUserMessage]
        : [newUserMessage];
    }

    // Update the chat locally. If this is a new chat and a system message was provided,
    // store that system message as the first message.
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: isNewChat
                ? systemMessage?.trim()
                  ? [{ role: "system", content: systemMessage }, newUserMessage]
                  : [newUserMessage]
                : [...chat.messages, newUserMessage],
              title: isNewChat ? message.slice(0, 30) : chat.title,
            }
          : chat
      )
    );

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

  const clearChatHistory = () => {
    setChats([]);
    localStorage.removeItem("chats");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar wrapper */}
      <div className="relative">
        <div
          className="transition-all duration-300 bg-card border-r h-full overflow-y-auto"
          style={{ width: sidebarOpen ? "16rem" : "2rem" }}
        >
          {sidebarOpen && (
            <>
              <div className="p-4 border-b">
                <SettingsModal
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  includeMemory={includeMemory}
                  setIncludeMemory={setIncludeMemory}
                  clearChatHistory={clearChatHistory}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              </div>
              <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
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
            includeMemory={includeMemory}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <img
                src="/sush.png"
                alt="Sushi"
                className="mx-auto mb-4 w-64 h-auto"
              />
              <h1 className="text-2xl font-bold">Welcome to Sushi AI</h1>
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
