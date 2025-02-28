// fe/src/db/messages.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';
import { Message } from '@/types/chat';

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
 * Get messages for a specific chat
 */
export async function getMessages(userId: string, chatId: string): Promise<Message[]> {
  log(`getMessages: Fetching messages for chat ${chatId}`);
  
  if (isDevMode()) {
    // In dev mode, use localStorage
    log(`getMessages: Using localStorage (dev mode)`);
    const messagesKey = `messages-${chatId}`;
    const messages = getLocalStorageItem(messagesKey) || [];
    
    // Sort by sequence number if available
    const sorted = [...messages].sort((a, b) => {
      if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
        return a.sequenceNumber - b.sequenceNumber;
      }
      return 0;
    });
    
    log(`getMessages: Found ${sorted.length} messages in localStorage`);
    return sorted;
  } else {
    // In production mode, use Supabase
    try {
      log(`getMessages: Querying Supabase`);
      const client = getClient();
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('sequence_number', { ascending: true });
      
      if (error) {
        logError(`getMessages ERROR: ${error.message}`, error);
        
        // Fallback to localStorage if Supabase fails
        const messagesKey = `messages-${chatId}`;
        const fallbackMessages = getLocalStorageItem(messagesKey) || [];
        log(`getMessages: Falling back to localStorage, found ${fallbackMessages.length} messages`);
        return fallbackMessages;
      }
      
      if (!data || data.length === 0) {
        log(`getMessages: No messages found in database`);
        return [];
      }
      
      log(`getMessages: Found ${data.length} messages in database`);
      
      // Map database format to our Message type
      const messages = data.map(item => ({
        id: item.id,
        role: item.role,
        content: item.content,
        model: item.model,
        createdAt: new Date(item.created_at),
        imagePaths: item.image_paths || [],
        sequenceNumber: item.sequence_number
      }));
      
      // Also save to localStorage for backup
      setLocalStorageItem(`messages-${chatId}`, messages);
      
      return messages;
    } catch (error) {
      logError(`getMessages ERROR: Unexpected error`, error);
      
      // Fallback to localStorage on any error
      const messagesKey = `messages-${chatId}`;
      const fallbackMessages = getLocalStorageItem(messagesKey) || [];
      log(`getMessages: Falling back to localStorage, found ${fallbackMessages.length} messages`);
      return fallbackMessages;
    }
  }
}

/**
 * Create a new message
 */
export async function createMessage(
  userId: string, 
  chatId: string, 
  message: Message, 
  sequenceNumber: number
): Promise<Message | null> {
  log(`createMessage: Creating message for chat ${chatId}, seq=${sequenceNumber}`);
  
  // Don't store messages for temporary chats
  if (chatId.startsWith('temp-')) {
    log(`createMessage: Skipping storage for temporary chat`);
    return message;
  }
  
  // Prepare the message object
  const newMessage = {
    id: `msg-${Date.now()}`,
    role: message.role,
    content: message.content,
    model: message.model,
    createdAt: new Date(),
    imagePaths: message.imagePaths || [],
    sequenceNumber
  };
  
  if (isDevMode()) {
    // In dev mode, only use localStorage
    log(`createMessage: Using localStorage (dev mode)`);
    
    // Save to localStorage
    const messagesKey = `messages-${chatId}`;
    const existingMessages = getLocalStorageItem(messagesKey) || [];
    setLocalStorageItem(messagesKey, [...existingMessages, newMessage]);
    
    log(`createMessage: Saved to localStorage, ID: ${newMessage.id}`);
    return newMessage;
  } else {
    // In production mode, use Supabase
    try {
      log(`createMessage: Saving to Supabase`);
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
        .select()
        .single();
      
      if (error) {
        logError(`createMessage ERROR: ${error.message}`, error);
        
        // Fallback to localStorage if Supabase fails
        const messagesKey = `messages-${chatId}`;
        const existingMessages = getLocalStorageItem(messagesKey) || [];
        setLocalStorageItem(messagesKey, [...existingMessages, newMessage]);
        
        log(`createMessage: Fallback to localStorage, ID: ${newMessage.id}`);
        return newMessage;
      }
      
      // Map the created database entry to our Message type
      const createdMessage = {
        id: data.id,
        role: data.role,
        content: data.content,
        model: data.model,
        createdAt: new Date(data.created_at),
        imagePaths: data.image_paths || [],
        sequenceNumber: data.sequence_number
      };
      
      // Also save to localStorage for backup
      const messagesKey = `messages-${chatId}`;
      const existingMessages = getLocalStorageItem(messagesKey) || [];
      setLocalStorageItem(messagesKey, [...existingMessages, createdMessage]);
      
      log(`createMessage: Saved to Supabase, ID: ${createdMessage.id}`);
      return createdMessage;
    } catch (error) {
      logError(`createMessage ERROR: Unexpected error`, error);
      
      // Fallback to localStorage on any error
      const messagesKey = `messages-${chatId}`;
      const existingMessages = getLocalStorageItem(messagesKey) || [];
      setLocalStorageItem(messagesKey, [...existingMessages, newMessage]);
      
      log(`createMessage: Fallback to localStorage, ID: ${newMessage.id}`);
      return newMessage;
    }
  }
}

/**
 * Delete all messages for a chat
 */
export async function deleteMessages(userId: string, chatId: string): Promise<boolean> {
  log(`deleteMessages: Deleting messages for chat ${chatId}`);
  
  // First delete from localStorage
  localStorage.removeItem(`messages-${chatId}`);
  log(`deleteMessages: Deleted from localStorage`);
  
  // If in dev mode, we're done
  if (isDevMode()) {
    return true;
  }
  
  // In production mode, also delete from Supabase
  try {
    log(`deleteMessages: Deleting from Supabase`);
    const client = getClient();
    const { error } = await client
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);
    
    if (error) {
      logError(`deleteMessages ERROR: ${error.message}`, error);
      return false;
    }
    
    log(`deleteMessages: Deleted from Supabase`);
    return true;
  } catch (error) {
    logError(`deleteMessages ERROR: Unexpected error`, error);
    return false;
  }
}