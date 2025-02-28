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
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from "@/lib/utils";

export default function App() {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeMemory, setIncludeMemory] = useState<boolean>(true);
  const [homeWorkspaceId, setHomeWorkspaceId] = useState<string>("");

  const { toast } = useToast();

  // Local storage based chat history loading
  useEffect(() => {
    // Always use the same workspace ID for consistency
    const localWorkspaceId = 'local-workspace';
    console.log("App: Using local workspace");
    setHomeWorkspaceId(localWorkspaceId);
    
    // Load chats from localStorage
    try {
      // Try to load chats from localStorage
      const localStorageKey = 'sushi-ai:local-chats';
      const savedChats = localStorage.getItem(localStorageKey);
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        console.log(`App: Loaded ${parsedChats.length} chats from localStorage`);
        
        // Ensure all chats have the required fields
        const validChats = parsedChats.map(chat => ({
          ...chat,
          id: chat.id || `chat-${Date.now()}`,
          title: chat.title || 'Untitled Chat',
          messages: chat.messages || [],
          createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
          workspaceId: localWorkspaceId,
          model: chat.model || 'gpt-4o-mini'
        }));
        
        setChats(validChats);
        
        toast({
          title: "Chats Loaded",
          description: `${validChats.length} conversation${validChats.length === 1 ? '' : 's'} loaded.`,
          duration: 3000,
        });
      } else {
        console.log("App: No saved chats found in localStorage");
        setChats([]);
        
        toast({
          title: "Welcome",
          description: "No previous conversations found. Start a new chat!",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("App: Error loading chats from localStorage:", error);
      setChats([]);
      
      toast({
        title: "Error",
        description: "Could not load previous conversations",
        duration: 3000,
      });
    }
  }, [toast]);

  const handleNewChat = async () => {
    try {
      console.log("Creating new local chat");
      
      // Use the consistent workspace ID
      const workspaceIdToUse = homeWorkspaceId;
      console.log("Using workspace:", workspaceIdToUse);
      
      // Create a chat locally
      const chatId = `chat-${Date.now()}`;
      const newChat = {
        id: chatId,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        workspaceId: workspaceIdToUse,
        model: selectedModel,
        systemPrompt: "You are a helpful assistant.",
        temperature: 0.7,
        contextLength: 4000
      };
      
      // Add to the chat list and select it
      console.log("Created new chat:", newChat.id, "with title:", newChat.title);
      
      // Update state with the new chat
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setSelectedChatId(newChat.id);
      
      // Save to localStorage
      const localStorageKey = 'sushi-ai:local-chats';
      localStorage.setItem(localStorageKey, JSON.stringify(updatedChats));
      console.log("Saved updated chat list to localStorage");
      
      toast({
        title: "Success",
        description: "Created new chat",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Could not create new chat",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => {
    if (!selectedChatId) {
      toast({
        title: "Error",
        description: "No chat selected",
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
    let newTitle = currentChat.title;
    
    // If this is the first message, set title from message
    if (isNewChat) {
      newTitle = message.slice(0, 30);
      console.log(`Setting chat title to: "${newTitle}"`);
    }

    // Create updated chat object first
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, newUserMessage],
      title: newTitle,
      updatedAt: new Date()
    };
    
    // Update all chats
    const updatedChats = chats.map(chat => 
      chat.id === selectedChatId ? updatedChat : chat
    );
    
    // Update state
    setChats(updatedChats);
    
    // Save to localStorage immediately for user message
    const localStorageKey = 'sushi-ai:local-chats';
    localStorage.setItem(localStorageKey, JSON.stringify(updatedChats));
    console.log("Saved user message to localStorage");
    
    // Send request to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      console.log("Sending message to API:", message);
      toast({
        title: "Processing",
        description: "Generating response...",
        duration: 2000,
      });
      
      // Create a simulated response if API call fails
      let assistantMessage: Message;
      
      try {
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
          throw new Error("API request failed");
        }

        const data = await response.json();
        assistantMessage = { 
          role: "assistant", 
          content: data.response,
          model: selectedModel 
        };
      } catch (apiError) {
        console.error("Error calling API:", apiError);
        // Fallback response
        assistantMessage = { 
          role: "assistant", 
          content: "I'm sorry, I couldn't connect to the backend service. Please check your network connection or try again later.",
          model: selectedModel 
        };
      }

      // Update with assistant response
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date()
      };
      
      // Update state with all conversations including assistant message
      const finalChats = updatedChats.map(chat => 
        chat.id === selectedChatId ? finalChat : chat
      );
      
      setChats(finalChats);
      
      // Save to localStorage again after assistant response
      localStorage.setItem(localStorageKey, JSON.stringify(finalChats));
      console.log("Saved assistant response to localStorage");
      
    } catch (error) {
      console.error("Error in message handling:", error);
      toast({
        title: "Error",
        description: "There was an issue processing your message.",
        variant: "destructive",
      });
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Handler for when a chat is selected from the sidebar - simplified
  const handleSelectChat = async (chatId: string) => {
    console.log(`Selecting chat: ${chatId}`);
    setSelectedChatId(chatId);
    
    // No need to load messages since we're keeping everything in local state
  };

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
                  onSelectChat={handleSelectChat}
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