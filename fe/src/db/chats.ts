// fe/src/db/chats.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { Chat } from '@/types/chat';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';

// Helper function to get the appropriate client
const getClient = () => {
  // Use supabaseAdmin if available, otherwise fall back to regular client
  return supabaseAdmin || supabase;
}

// Debug mode to log all operations
const DEBUG = true;

// Get all chats for a workspace
export async function getChats(userId: string, workspaceId?: string): Promise<Chat[]> {
  if (DEBUG) console.log(`getChats: Fetching chats for user ${userId} ${workspaceId ? `in workspace ${workspaceId}` : ''}`);
  
  // First try to get from localStorage for immediate display
  const localChatsKey = `chats-${userId}`;
  const localChats = getLocalStorageItem(localChatsKey) || [];
  
  if (localChats.length > 0) {
    if (DEBUG) console.log(`getChats: Found ${localChats.length} chats in localStorage`);
    const filteredChats = workspaceId 
      ? localChats.filter((chat: Chat) => chat.workspaceId === workspaceId)
      : localChats;
      
    // Continue with Supabase query in the background
    setTimeout(() => {
      fetchChatsFromSupabase(userId, workspaceId);
    }, 100);
    
    return filteredChats;
  }
  
  // If no localStorage data, fetch from Supabase directly
  return await fetchChatsFromSupabase(userId, workspaceId);
}

// Helper function to fetch chats from Supabase
async function fetchChatsFromSupabase(userId: string, workspaceId?: string): Promise<Chat[]> {
  try {
    if (DEBUG) console.log(`fetchChatsFromSupabase: Querying for user ${userId}`);
    
    const client = getClient();
    const query = client
      .from('chats')
      .select('*')  // Select all columns to ensure we get everything
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
      
    // Add workspace filter if provided
    if (workspaceId) {
      query.eq('workspace_id', workspaceId);
    }
      
    const { data, error } = await query;

    if (error) {
      if (DEBUG) console.error(`fetchChatsFromSupabase ERROR: ${error.message}`, error);
      return [];
    }

    if (!data || data.length === 0) {
      if (DEBUG) console.log(`fetchChatsFromSupabase: No chats found for user ${userId}`);
      return [];
    }

    if (DEBUG) console.log(`fetchChatsFromSupabase SUCCESS: Found ${data.length} chats`);
    
    const mappedChats = data.map(chat => ({
      id: chat.id,
      title: chat.name || 'Untitled Chat',
      messages: [], // Messages will be loaded separately
      createdAt: new Date(chat.created_at),
      updatedAt: new Date(chat.updated_at || chat.created_at),
      model: chat.model || 'gpt-4o-mini',
      workspaceId: chat.workspace_id,
      systemPrompt: chat.prompt || 'You are a helpful assistant',
      temperature: chat.temperature || 0.7,
      contextLength: chat.context_length || 4000,
      userId: userId
    }));
    
    // Store in localStorage for future use
    const localChatsKey = `chats-${userId}`;
    setLocalStorageItem(localChatsKey, mappedChats);
    
    return mappedChats;
  } catch (error) {
    if (DEBUG) console.error(`fetchChatsFromSupabase FATAL ERROR: ${error}`);
    return [];
  }
}

// Create a new chat
export async function createChat(userId: string, workspaceId: string, chat: Partial<Chat>): Promise<Chat | null> {
  if (!userId || !workspaceId) {
    if (DEBUG) console.error(`createChat ERROR: Missing userId or workspaceId`);
    return null;
  }
  
  if (DEBUG) console.log(`createChat: Creating chat for user ${userId} in workspace ${workspaceId}`);
  
  try {
    const client = getClient();
    const { data, error } = await client
      .from('chats')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        name: chat.title || 'New Chat',
        model: chat.model || 'gpt-4o-mini',
        prompt: chat.systemPrompt || 'You are a helpful assistant.',
        temperature: chat.temperature || 0.7
      })
      .select('*')
      .single();

    if (error) {
      if (DEBUG) console.error(`createChat ERROR: ${error.message}`, error);
      throw error;
    }

    if (!data) {
      if (DEBUG) console.error(`createChat ERROR: No data returned`);
      throw new Error('No data returned from create operation');
    }

    if (DEBUG) console.log(`createChat SUCCESS: Created chat with ID ${data.id}`);
    
    const newChat = {
      id: data.id,
      title: data.name || 'New Chat',
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
      model: data.model || 'gpt-4o-mini',
      workspaceId: data.workspace_id,
      systemPrompt: data.prompt || 'You are a helpful assistant.',
      temperature: data.temperature || 0.7,
      userId
    };
    
    // Store in localStorage for backup
    const localChats = getLocalStorageItem(`chats-${userId}`) || [];
    setLocalStorageItem(`chats-${userId}`, [newChat, ...localChats]);
    
    return newChat;
  } catch (error) {
    if (DEBUG) console.error(`createChat FATAL ERROR: ${error}`);
    return null;
  }
}

// Update an existing chat
export async function updateChat(userId: string, chatId: string, updates: Partial<Chat>): Promise<boolean> {
  if (DEBUG) console.log(`updateChat: Updating chat ${chatId} for user ${userId}`, updates);
  
  try {
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
      if (DEBUG) console.error(`updateChat ERROR: ${error.message}`, error);
      return false;
    }
    
    if (DEBUG) console.log(`updateChat SUCCESS: Updated chat ${chatId}`);
    
    // Update in localStorage too
    try {
      const localChats = getLocalStorageItem(`chats-${userId}`) || [];
      const updatedLocalChats = localChats.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            ...updates,
            title: updates.title || chat.title,
            model: updates.model || chat.model,
            systemPrompt: updates.systemPrompt || chat.systemPrompt,
            temperature: updates.temperature || chat.temperature,
            updatedAt: new Date()
          };
        }
        return chat;
      });
      
      setLocalStorageItem(`chats-${userId}`, updatedLocalChats);
    } catch (localError) {
      if (DEBUG) console.warn(`updateChat localStorage ERROR: ${localError}`);
    }
    
    return true;
  } catch (error) {
    if (DEBUG) console.error(`updateChat FATAL ERROR: ${error}`);
    return false;
  }
}

// Delete a chat
export async function deleteChat(userId: string, chatId: string): Promise<boolean> {
  if (DEBUG) console.log(`deleteChat: Deleting chat ${chatId} for user ${userId}`);
  
  try {
    const client = getClient();
    const { error } = await client
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) {
      if (DEBUG) console.error(`deleteChat ERROR: ${error.message}`, error);
      return false;
    }
    
    if (DEBUG) console.log(`deleteChat SUCCESS: Deleted chat ${chatId}`);
    
    // Remove from localStorage too
    try {
      const localChats = getLocalStorageItem(`chats-${userId}`) || [];
      const filteredChats = localChats.filter(chat => chat.id !== chatId);
      setLocalStorageItem(`chats-${userId}`, filteredChats);
    } catch (localError) {
      if (DEBUG) console.warn(`deleteChat localStorage ERROR: ${localError}`);
    }
    
    return true;
  } catch (error) {
    if (DEBUG) console.error(`deleteChat FATAL ERROR: ${error}`);
    return false;
  }
}