// fe/src/db/chats.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { Chat } from '@/types/chat';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';

// Debug mode
const DEBUG = true;

// Get the appropriate client
const getClient = () => {
  return supabaseAdmin || supabase;
};

// Logs a message only if DEBUG is true
const log = (message: string, ...data: any[]) => {
  if (DEBUG) {
    console.log(message, ...data);
  }
};

// Logs an error
const logError = (message: string, error: any) => {
  console.error(message, error);
};

/**
 * Get all chats for a user
 */
export async function getChats(userId: string, workspaceId?: string): Promise<Chat[]> {
  log(`getChats: Fetching chats for user ${userId}`);
  
  if (isDevMode()) {
    // In dev mode, use localStorage
    log(`getChats: Using localStorage (dev mode)`);
    const chatKey = `chats-${userId}`;
    const chats = getLocalStorageItem(chatKey) || [];
    
    // Ensure all chats have valid titles
    const validatedChats = chats.map((chat: Chat) => {
      if (!chat.title) {
        return {...chat, title: 'New Chat'};
      }
      return chat;
    });
    
    // Filter by workspace if needed
    const filtered = workspaceId 
      ? validatedChats.filter((c: Chat) => c.workspaceId === workspaceId)
      : validatedChats;
    
    // Make sure we persist any fixes
    if (validatedChats.length !== chats.length) {
      setLocalStorageItem(chatKey, validatedChats);
    }
    
    log(`getChats: Found ${filtered.length} chats in localStorage`);
    return filtered;
  } else {
    // In production mode, use Supabase
    try {
      log(`getChats: Querying Supabase`);
      const client = getClient();
      const { data, error } = await client
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        logError(`getChats ERROR: ${error.message}`, error);
        
        // Fallback to localStorage if Supabase fails
        const fallbackChats = getLocalStorageItem(`chats-${userId}`) || [];
        log(`getChats: Falling back to localStorage, found ${fallbackChats.length} chats`);
        return fallbackChats;
      }
      
      if (!data || data.length === 0) {
        log(`getChats: No chats found in database`);
        return [];
      }
      
      log(`getChats: Found ${data.length} chats in database`);
      
      // Map database format to our Chat type
      const chats = data.map(item => {
        // Debug the raw chat data
        log(`getChats: Processing chat ${item.id} with name: "${item.name}"`);
        
        return {
          id: item.id,
          title: item.name || 'New Chat', // Ensure a title exists
          messages: [], // Messages are loaded separately
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at || item.created_at),
          workspaceId: item.workspace_id,
          model: item.model || 'gpt-4o-mini',
          systemPrompt: item.prompt || 'You are a helpful assistant.',
          temperature: item.temperature || 0.7,
          contextLength: item.context_length || 4000
        };
      });
      
      // Also save to localStorage for backup
      setLocalStorageItem(`chats-${userId}`, chats);
      
      return chats;
    } catch (error) {
      logError(`getChats ERROR: Unexpected error`, error);
      
      // Fallback to localStorage on any error
      const fallbackChats = getLocalStorageItem(`chats-${userId}`) || [];
      log(`getChats: Falling back to localStorage, found ${fallbackChats.length} chats`);
      return fallbackChats;
    }
  }
}

/**
 * Create a new chat
 */
export async function createChat(userId: string, workspaceId: string, chat: Partial<Chat>): Promise<Chat | null> {
  log(`createChat: Creating chat for user ${userId}`);
  
  // Ensure we have a title
  const chatTitle = chat.title || 'New Chat';
  log(`createChat: Using title: "${chatTitle}"`);
  
  // Prepare the chat object
  const newChat = {
    id: `chat-${Date.now()}`,
    title: chatTitle,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    workspaceId: workspaceId,
    model: chat.model || 'gpt-4o-mini',
    systemPrompt: chat.systemPrompt || 'You are a helpful assistant.',
    temperature: chat.temperature || 0.7,
    contextLength: chat.contextLength || 4000
  };
  
  if (isDevMode()) {
    // In dev mode, only use localStorage
    log(`createChat: Using localStorage (dev mode)`);
    
    // Save to localStorage
    const chatKey = `chats-${userId}`;
    const existingChats = getLocalStorageItem(chatKey) || [];
    setLocalStorageItem(chatKey, [newChat, ...existingChats]);
    
    log(`createChat: Saved to localStorage, ID: ${newChat.id}, Title: "${newChat.title}"`);
    return newChat;
  } else {
    // In production mode, use Supabase
    try {
      log(`createChat: Saving to Supabase`);
      const client = getClient();
      const { data, error } = await client
        .from('chats')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          name: chatTitle,
          model: chat.model || 'gpt-4o-mini',
          prompt: chat.systemPrompt || 'You are a helpful assistant.',
          temperature: chat.temperature || 0.7,
          context_length: chat.contextLength || 4000
        })
        .select()
        .single();
      
      if (error) {
        logError(`createChat ERROR: ${error.message}`, error);
        
        // Fallback to localStorage if Supabase fails
        const chatKey = `chats-${userId}`;
        const existingChats = getLocalStorageItem(chatKey) || [];
        setLocalStorageItem(chatKey, [newChat, ...existingChats]);
        
        log(`createChat: Fallback to localStorage, ID: ${newChat.id}, Title: "${newChat.title}"`);
        return newChat;
      }
      
      // Map the created database entry to our Chat type
      const createdChat = {
        id: data.id,
        title: data.name || chatTitle, // Ensure title exists
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at || data.created_at),
        workspaceId: data.workspace_id,
        model: data.model || 'gpt-4o-mini',
        systemPrompt: data.prompt || 'You are a helpful assistant.',
        temperature: data.temperature || 0.7,
        contextLength: data.context_length || 4000
      };
      
      log(`createChat: Created in Supabase with ID: ${createdChat.id}, Title: "${createdChat.title}"`);
      
      // Also save to localStorage for backup
      const chatKey = `chats-${userId}`;
      const existingChats = getLocalStorageItem(chatKey) || [];
      setLocalStorageItem(chatKey, [createdChat, ...existingChats]);
      
      return createdChat;
    } catch (error) {
      logError(`createChat ERROR: Unexpected error`, error);
      
      // Fallback to localStorage on any error
      const chatKey = `chats-${userId}`;
      const existingChats = getLocalStorageItem(chatKey) || [];
      setLocalStorageItem(chatKey, [newChat, ...existingChats]);
      
      log(`createChat: Fallback to localStorage, ID: ${newChat.id}, Title: "${newChat.title}"`);
      return newChat;
    }
  }
}

/**
 * Update an existing chat
 */
export async function updateChat(userId: string, chatId: string, updates: Partial<Chat>): Promise<boolean> {
  log(`updateChat: Updating chat ${chatId}`);
  
  // First update in localStorage for immediate effect
  const chatKey = `chats-${userId}`;
  const existingChats = getLocalStorageItem(chatKey) || [];
  const updatedChats = existingChats.map(chat => {
    if (chat.id === chatId) {
      return { 
        ...chat,
        title: updates.title !== undefined ? updates.title : chat.title,
        model: updates.model !== undefined ? updates.model : chat.model,
        systemPrompt: updates.systemPrompt !== undefined ? updates.systemPrompt : chat.systemPrompt,
        temperature: updates.temperature !== undefined ? updates.temperature : chat.temperature,
        updatedAt: new Date()
      };
    }
    return chat;
  });
  
  setLocalStorageItem(chatKey, updatedChats);
  log(`updateChat: Updated in localStorage`);
  
  // If in dev mode, we're done
  if (isDevMode()) {
    return true;
  }
  
  // In production mode, also update in Supabase
  try {
    log(`updateChat: Updating in Supabase`);
    const client = getClient();
    const { error } = await client
      .from('chats')
      .update({
        name: updates.title,
        model: updates.model,
        prompt: updates.systemPrompt,
        temperature: updates.temperature,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .eq('user_id', userId);
    
    if (error) {
      logError(`updateChat ERROR: ${error.message}`, error);
      return false;
    }
    
    log(`updateChat: Updated in Supabase`);
    return true;
  } catch (error) {
    logError(`updateChat ERROR: Unexpected error`, error);
    return false;
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(userId: string, chatId: string): Promise<boolean> {
  log(`deleteChat: Deleting chat ${chatId}`);
  
  // First delete from localStorage
  const chatKey = `chats-${userId}`;
  const existingChats = getLocalStorageItem(chatKey) || [];
  const filteredChats = existingChats.filter(chat => chat.id !== chatId);
  setLocalStorageItem(chatKey, filteredChats);
  
  // Also clear messages for this chat
  localStorage.removeItem(`messages-${chatId}`);
  
  log(`deleteChat: Deleted from localStorage`);
  
  // If in dev mode, we're done
  if (isDevMode()) {
    return true;
  }
  
  // In production mode, also delete from Supabase
  try {
    log(`deleteChat: Deleting from Supabase`);
    const client = getClient();
    const { error } = await client
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);
    
    if (error) {
      logError(`deleteChat ERROR: ${error.message}`, error);
      return false;
    }
    
    log(`deleteChat: Deleted from Supabase`);
    return true;
  } catch (error) {
    logError(`deleteChat ERROR: Unexpected error`, error);
    return false;
  }
}