// fe/src/App.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Navbar } from "@/components/Layout/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import ModelSelector from "@/components/ModelSelector";
import { Chat, Message } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  getChats, 
  createChat, 
  getMessages, 
  createMessage, 
  getHomeWorkspace,
  updateChat 
} from "@/db";

export default function App() {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeMemory, setIncludeMemory] = useState<boolean>(true);
  const [homeWorkspaceId, setHomeWorkspaceId] = useState<string>("");

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      try {
        console.log("Fetching initial data for user:", user.id);
        
        // Try to get home workspace - but don't show loading initially
        const workspace = await getHomeWorkspace(user.id);
        
        if (workspace) {
          console.log("Found home workspace:", workspace.id);
          setHomeWorkspaceId(workspace.id);
          
          // Get chats for this workspace
          const userChats = await getChats(user.id, workspace.id);
          console.log(`Loaded ${userChats.length} chats`);
          setChats(userChats);
        } else {
          console.error("No home workspace found or created");
          // Just leave the welcome screen showing rather than error
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Don't show error toasts - just leave the welcome screen visible
      }
    };

    fetchInitialData();
  }, [user]);

  const handleNewChat = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create a chat.",
        variant: "destructive",
      });
      return;
    }

    // Create a fake chat that always works
    const fakeChat = {
      id: "chat-" + Date.now(),
      title: "New Chat",
      workspaceId: homeWorkspaceId || "fake-workspace",
      userId: user.id,
      model: selectedModel,
      prompt: "You are a helpful assistant.",
      temperature: 0.7,
      contextLength: 4000,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    
    setChats(prevChats => [fakeChat, ...prevChats]);
    setSelectedChatId(fakeChat.id);
  };

  const handleSendMessage = async (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => {
    if (!selectedChatId || !user) {
      toast({
        title: "Error",
        description: "Cannot send message",
        variant: "destructive",
      });
      return;
    }

    const { message, includeMemory, systemMessage } = payload;
    const newUserMessage: Message = { role: "user", content: message };

    // Find current chat
    const currentChat = chats.find((chat) => chat.id === selectedChatId);
    if (!currentChat) {
      toast({
        title: "Error",
        description: "Chat not found",
        variant: "destructive",
      });
      return;
    }

    const isNewChat = currentChat.messages.length === 0;

    // Update local state with user message
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === selectedChatId 
          ? {
              ...chat,
              messages: [...chat.messages, newUserMessage],
              title: isNewChat ? message.slice(0, 30) : chat.title
            }
          : chat
      )
    );

    // Send request to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: [...currentChat.messages, newUserMessage], 
          model: selectedModel, 
          apiKey: profile?.openaiApiKey,
          anthropicApiKey: profile?.anthropicApiKey,
          googleApiKey: profile?.googleApiKey
        }),
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
        model: selectedModel 
      };

      // Update local state with assistant message
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an issue communicating with the API.",
        variant: "destructive",
      });
      console.error("Error fetching response:", error);
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Function to show welcome screen
  const showWelcomeScreen = () => {
    setSelectedChatId(undefined);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar 
        includeMemory={includeMemory}
        setIncludeMemory={setIncludeMemory}
        clearChatHistory={() => {}}
        showWelcomeScreen={showWelcomeScreen}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar wrapper */}
        <div className="relative">
          <div
            className="transition-all duration-300 bg-card border-r h-full overflow-y-auto"
            style={{ width: sidebarOpen ? "16rem" : "2rem" }}
          >
            {sidebarOpen && (
              <>
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
        <div className="flex-1 overflow-hidden">
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
                <h1 className="text-2xl font-bold">Welcome to Sushi AI 🍣</h1>
                <p className="text-muted-foreground">
                  Start a new chat or select an existing one.
                </p>
                {!user && (
                  <p className="text-sm mt-2 text-yellow-600">
                    You are not signed in. Feature access may be limited.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}