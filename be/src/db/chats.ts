// be/src/db/chats.ts
import { supabase } from '../lib/supabase/server-client';
import { Database } from '../types/database.types';

type Chat = Database['public']['Tables']['chats']['Row'];
type ChatInsert = Database['public']['Tables']['chats']['Insert'];
type ChatUpdate = Database['public']['Tables']['chats']['Update'];

/**
 * Get a chat by ID
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();
  
  if (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all chats for a workspace
 */
export async function getChatsByWorkspaceId(workspaceId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
  
  return data;
}

/**
 * Create a new chat
 */
export async function createChat(chat: ChatInsert): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .insert([chat])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a chat
 */
export async function updateChat(chatId: string, updates: ChatUpdate): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .update(updates)
    .eq('id', chatId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating chat:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);
  
  if (error) {
    console.error('Error deleting chat:', error);
    return false;
  }
  
  return true;
}