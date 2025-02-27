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
  getHomeWorkspace 
} from "@/db";

export default function App() {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeMemory, setIncludeMemory] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [homeWorkspaceId, setHomeWorkspaceId] = useState<string>("");

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    if (user) {
      // Get home workspace and chats
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          // Get home workspace
          const workspace = await getHomeWorkspace(user.id);
          if (workspace) {
            setHomeWorkspaceId(workspace.id);
            
            // Get chats for this workspace
            const userChats = await getChats(user.id, workspace.id);
            setChats(userChats);
          } else {
            // Fallback for when home workspace isn't found
            console.log("No home workspace found");
            setHomeWorkspaceId(""); // Empty string instead of invalid UUID
            setChats([]);
          }
          
          setSelectedChatId(undefined); // Make sure no chat is selected initially
          
        } catch (error) {
          console.error("Error fetching initial data:", error);
          // Fallback for development
          console.log("Error handling - No workspace found");
          setHomeWorkspaceId("");
          setChats([]);
        } finally {
          setLoading(false);
        }
      };

      fetchInitialData();
    }
  }, [user, profile]);

  const handleNewChat = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Cannot create a new chat at this time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const workspaceId = homeWorkspaceId;
      
      if (!workspaceId) {
        console.error("No valid workspace ID available for creating chat");
        throw new Error("No valid workspace ID");
      }
      
      // Create a new chat via the database
      const newChat = await createChat(
        user.id, 
        workspaceId, 
        {
          title: "New Chat",
          model: selectedModel || "gpt-4o-mini",
          prompt: "You are a helpful assistant.",
          temperature: 0.7,
          contextLength: 4000
        }
      );
      
      console.log("Creating new chat:", newChat);
      
      if (newChat) {
        // Update state with the newly created chat
        setChats(prevChats => [newChat, ...prevChats]);
        setSelectedChatId(newChat.id);
        
        // Toast success message
        toast({
          title: "Success",
          description: "New chat created successfully",
        });
      } else {
        // Fallback to client-side chat creation if DB operation fails
        const newChatId = crypto.randomUUID();
        // Make sure we have a valid workspace ID
      if (!workspaceId) {
        toast({
          title: "Error",
          description: "No workspace available for creating a chat",
          variant: "destructive",
        });
        return;
      }
        
      const clientChat: Chat = {
          id: newChatId,
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          model: selectedModel || "gpt-4o-mini",
          workspaceId: workspaceId,
          systemPrompt: "You are a helpful assistant.",
          temperature: 0.7
        };
        
        setChats(prevChats => [clientChat, ...prevChats]);
        setSelectedChatId(clientChat.id);
        
        toast({
          title: "Warning",
          description: "Created chat in memory only (database operation failed)",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      
      // Fallback to client-side chat creation on error
      const newChatId = crypto.randomUUID();
      // Use homeWorkspaceId directly without fallback to invalid ID
      if (!homeWorkspaceId) {
        console.error("No valid workspace ID available for creating fallback chat");
        // Create a fully in-memory chat without persisting to DB
        const fallbackChat: Chat = {
          id: newChatId,
          title: "New Chat (Memory Only)",
          messages: [],
          createdAt: new Date(),
          model: selectedModel || "gpt-4o-mini",
          workspaceId: "memory-only",
          systemPrompt: "You are a helpful assistant.",
          temperature: 0.7
        };
        
        setChats(prevChats => [fallbackChat, ...prevChats]);
        setSelectedChatId(fallbackChat.id);
        
        toast({
          title: "Warning",
          description: "Created chat in memory only (no workspace available)",
          variant: "default",
        });
        
        return;
      }
      
      const fallbackChat: Chat = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        model: selectedModel || "gpt-4o-mini",
        workspaceId: homeWorkspaceId,
        systemPrompt: "You are a helpful assistant.",
        temperature: 0.7
      };
      
      setChats(prevChats => [fallbackChat, ...prevChats]);
      setSelectedChatId(fallbackChat.id);
      
      toast({
        title: "Warning",
        description: "Created chat in memory only (database error occurred)",
        variant: "default",
      });
    }
  };

  const handleSendMessage = async (payload: {
    message: string;
    includeMemory: boolean;
    systemMessage?: string;
  }) => {
    if (!selectedChatId || !user) {
      toast({
        title: "Error",
        description: "Cannot send message at this time.",
        variant: "destructive",
      });
      return;
    }

    const { message, includeMemory, systemMessage } = payload;
    const newUserMessage: Message = { role: "user", content: message };

    // Find current chat
    const currentChat = chats.find((chat) => chat.id === selectedChatId) || {
      messages: [],
    };
    const isNewChat = currentChat.messages.length === 0;

    // Prepare conversation history
    let conversation: Message[] = [];
    if (includeMemory) {
      if (isNewChat) {
        conversation = systemMessage?.trim()
          ? [{ role: "system", content: systemMessage }, newUserMessage]
          : [newUserMessage];
      } else {
        conversation = [...currentChat.messages, newUserMessage];
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

    // Update local state with user message
    const updatedChats = chats.map((chat) =>
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
    );
    setChats(updatedChats);

    // Save user message to the database
    if (user) {
      try {
        await createMessage(
          user.id, 
          selectedChatId, 
          newUserMessage, 
          isNewChat ? 0 : currentChat.messages.length
        );
      } catch (error) {
        console.error("Failed to save message, but continuing with chat:", error);
        // Continue anyway for development
      }
    }

    // Send request to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: conversation, 
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
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );

      // Save assistant message to the database
      if (user) {
        try {
          await createMessage(
            user.id, 
            selectedChatId, 
            assistantMessage, 
            isNewChat ? 1 : currentChat.messages.length + 1
          );
        } catch (error) {
          console.error("Failed to save assistant message, but continuing with chat:", error);
          // Continue anyway for development
        }
      }
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
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
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Loading your chats...</p>
              </div>
            </div>
          ) : selectedChat ? (
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
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}