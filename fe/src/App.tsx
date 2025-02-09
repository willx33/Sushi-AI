// src/App.tsx
import { useEffect, useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ChatWindow } from './components/chat/ChatWindow';
import { ApiKeyInput } from './components/ApiKeyInput';
import { Chat, Message } from './types/chat';
import { ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { ScrollArea } from './components/ui/scroll-area';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';

export default function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
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
        variant: "destructive" 
      });
      return;
    }

    const newMessage: Message = { role: 'user', content };
    
    setChats(chats => chats.map(chat => 
      chat.id === selectedChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, newMessage],
            title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title,
          }
        : chat
    ));

    // TODO: Add OpenAI API integration
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="fixed inset-0 flex h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <div className="flex h-full flex-col">
            <ApiKeyInput onSave={setApiKey} initialKey={apiKey} />
            <Sidebar
              chats={chats}
              onNewChat={handleNewChat}
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          </div>
        </ResizablePanel>
        <ResizablePanel defaultSize={80}>
          <ScrollArea className="h-full">
            {selectedChat ? (
              <ChatWindow
                messages={selectedChat.messages}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tighter">Welcome to ChatGPT</h1>
                  <p className="text-muted-foreground">Choose a chat or start a new one</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </div>
  );
}