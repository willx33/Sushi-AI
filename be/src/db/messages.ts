// be/src/db/messages.ts
import { supabase } from '../lib/supabase/server-client';
import { Database } from '../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

/**
 * Get all messages for a chat
 */
export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('sequence_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data;
}

/**
 * Create a new message
 */
export async function createMessage(message: MessageInsert): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating message:', error);
    return null;
  }
  
  return data;
}

/**
 * Create multiple messages at once
 */
export async function createMessages(messages: MessageInsert[]): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .insert(messages)
    .select();
  
  if (error) {
    console.error('Error creating messages:', error);
    return [];
  }
  
  return data;
}

/**
 * Update a message
 */
export async function updateMessage(messageId: string, updates: MessageUpdate): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating message:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  
  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }
  
  return true;
}

/**
 * Delete all messages for a chat
 */
export async function deleteMessagesByChatId(chatId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);
  
  if (error) {
    console.error('Error deleting messages:', error);
    return false;
  }
  
  return true;
}