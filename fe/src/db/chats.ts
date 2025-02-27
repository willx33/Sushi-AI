// fe/src/db/chats.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { Chat } from '@/types/chat';

// Helper function to get the appropriate client
const getClient = () => {
  // Use supabaseAdmin if available, otherwise fall back to regular client
  return supabaseAdmin || supabase;
}

export async function getChats(userId: string, workspaceId?: string): Promise<Chat[]> {
  const client = getClient();
  const query = client
    .from('chats')
    .select('id, workspace_id, name, model, prompt, temperature, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  // Add workspace filter if provided
  if (workspaceId) {
    query.eq('workspace_id', workspaceId);
  }
    
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }

  return data.map(chat => ({
    id: chat.id,
    title: chat.name,
    messages: [], // Messages will be loaded separately
    createdAt: new Date(chat.created_at),
    model: chat.model,
    workspaceId: chat.workspace_id,
    systemPrompt: chat.prompt,
    temperature: chat.temperature
  }));
}

export async function createChat(userId: string, workspaceId: string, chat: Partial<Chat>): Promise<Chat | null> {
  try {
    if (!workspaceId) {
      console.error('No workspace ID provided to createChat');
      return null;
    }
    
    console.log(`Creating chat with workspace ID: ${workspaceId}`);
    
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
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    console.log('Chat created successfully:', data);
    
    return {
      id: data.id,
      title: data.name,
      messages: [],
      createdAt: new Date(data.created_at),
      model: data.model,
      workspaceId: data.workspace_id,
      systemPrompt: data.prompt,
      temperature: data.temperature
    };
  } catch (error) {
    console.error('Unexpected error in createChat:', error);
    return null;
  }
}

export async function updateChat(userId: string, chatId: string, updates: Partial<Chat>): Promise<boolean> {
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

  return !error;
}

export async function deleteChat(userId: string, chatId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId);

  return !error;
}