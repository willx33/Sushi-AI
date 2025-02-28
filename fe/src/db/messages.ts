// fe/src/db/messages.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';
import { Message } from '@/types/chat';

// Helper function to get the appropriate client
const getClient = () => {
  // Use supabaseAdmin if available, otherwise fall back to regular client
  return supabaseAdmin || supabase;
}

// Debug mode to log all operations
const DEBUG = true;

export async function getMessages(userId: string, chatId: string): Promise<Message[]> {
  if (DEBUG) console.log(`getMessages: Fetching messages for chat ${chatId}`);
  
  try {
    const client = getClient();
    const { data, error } = await client
      .from('messages')
      .select('id, chat_id, content, role, model, created_at, sequence_number, image_paths')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('sequence_number', { ascending: true });

    if (error) {
      if (DEBUG) console.error(`getMessages ERROR: ${error.message}`, error);
      
      // Try localStorage
      const messagesKey = `messages-${chatId}`;
      const localMessages = getLocalStorageItem(messagesKey) || [];
      return localMessages.sort((a, b) => 
        (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
      );
    }

    if (!data || data.length === 0) {
      if (DEBUG) console.log(`getMessages: No messages found for chat ${chatId}`);
      return [];
    }

    if (DEBUG) console.log(`getMessages SUCCESS: Found ${data.length} messages`);
    
    const messages = data.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      model: message.model,
      createdAt: new Date(message.created_at),
      imagePaths: message.image_paths || [],
      sequenceNumber: message.sequence_number
    }));
    
    // Save to localStorage for backup
    setLocalStorageItem(`messages-${chatId}`, messages);
    
    return messages;
  } catch (error) {
    if (DEBUG) console.error(`getMessages FATAL ERROR: ${error}`);
    
    // Try localStorage as last resort
    const messagesKey = `messages-${chatId}`;
    const localMessages = getLocalStorageItem(messagesKey) || [];
    return localMessages.sort((a, b) => 
      (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
    );
  }
}

export async function createMessage(
  userId: string, 
  chatId: string, 
  message: Message, 
  sequenceNumber: number
): Promise<Message | null> {
  if (DEBUG) console.log(`createMessage: Creating message for chat ${chatId}, sequence ${sequenceNumber}`);
  
  try {
    const client = getClient();
    const { data, error } = await client
      .from('messages')
      .insert({
        user_id: userId,
        chat_id: chatId,
        content: message.content,
        role: message.role,
        model: message.model,
        sequence_number: sequenceNumber,
        image_paths: message.imagePaths || []
      })
      .select('*')
      .single();

    if (error) {
      if (DEBUG) console.error(`createMessage ERROR: ${error.message}`, error);
      
      // Save to localStorage even if Supabase fails
      const newMessage = {
        id: `local-msg-${Date.now()}`,
        role: message.role,
        content: message.content,
        model: message.model,
        createdAt: new Date(),
        imagePaths: message.imagePaths || [],
        sequenceNumber
      };
      
      const messagesKey = `messages-${chatId}`;
      const localMessages = getLocalStorageItem(messagesKey) || [];
      setLocalStorageItem(messagesKey, [...localMessages, newMessage]);
      
      return newMessage;
    }

    if (!data) {
      if (DEBUG) console.error(`createMessage ERROR: No data returned`);
      throw new Error('No data returned from create operation');
    }

    if (DEBUG) console.log(`createMessage SUCCESS: Created message with ID ${data.id}`);
    
    const newMessage = {
      id: data.id,
      role: data.role,
      content: data.content,
      model: data.model,
      createdAt: new Date(data.created_at),
      imagePaths: data.image_paths || [],
      sequenceNumber: data.sequence_number
    };
    
    // Save to localStorage for backup
    const messagesKey = `messages-${chatId}`;
    const localMessages = getLocalStorageItem(messagesKey) || [];
    setLocalStorageItem(messagesKey, [...localMessages, newMessage]);
    
    return newMessage;
  } catch (error) {
    if (DEBUG) console.error(`createMessage FATAL ERROR: ${error}`);
    
    // Create in localStorage as fallback
    const newMessage = {
      id: `local-msg-${Date.now()}`,
      role: message.role,
      content: message.content,
      model: message.model,
      createdAt: new Date(),
      imagePaths: message.imagePaths || [],
      sequenceNumber
    };
    
    const messagesKey = `messages-${chatId}`;
    const localMessages = getLocalStorageItem(messagesKey) || [];
    setLocalStorageItem(messagesKey, [...localMessages, newMessage]);
    
    return newMessage;
  }
}

export async function deleteMessages(userId: string, chatId: string): Promise<boolean> {
  if (DEBUG) console.log(`deleteMessages: Deleting messages for chat ${chatId}`);
  
  try {
    const client = getClient();
    const { error } = await client
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);

    if (error) {
      if (DEBUG) console.error(`deleteMessages ERROR: ${error.message}`, error);
      return false;
    }
    
    if (DEBUG) console.log(`deleteMessages SUCCESS: Deleted messages for chat ${chatId}`);
    
    // Remove from localStorage too
    try {
      localStorage.removeItem(`messages-${chatId}`);
    } catch (localError) {
      if (DEBUG) console.warn(`deleteMessages localStorage ERROR: ${localError}`);
    }
    
    return true;
  } catch (error) {
    if (DEBUG) console.error(`deleteMessages FATAL ERROR: ${error}`);
    return false;
  }
}