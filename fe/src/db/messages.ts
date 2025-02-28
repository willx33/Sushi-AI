// fe/src/db/messages.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';
import { Message } from '@/types/chat';

// Helper function to get the appropriate client
const getClient = () => {
  // Use supabaseAdmin if available, otherwise fall back to regular client
  return supabaseAdmin || supabase;
}

export async function getMessages(userId: string, chatId: string): Promise<Message[]> {
  // In dev mode, try Supabase first but fall back to localStorage
  if (isDevMode()) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('messages')
        .select('id, chat_id, content, role, model, created_at, sequence_number, image_paths')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.warn('Error fetching messages from Supabase, checking localStorage:', error);
        
        // Try to get messages from localStorage
        const chatMessagesKey = `messages-${chatId}`;
        const localMessages = getLocalStorageItem(chatMessagesKey) || [];
        
        return localMessages.sort((a, b) => 
          (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
        );
      }

      return data.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        model: message.model,
        createdAt: new Date(message.created_at),
        imagePaths: message.image_paths || []
      }));
    } catch (error) {
      console.warn('Error accessing Supabase, using localStorage:', error);
      
      // Try to get messages from localStorage
      const chatMessagesKey = `messages-${chatId}`;
      const localMessages = getLocalStorageItem(chatMessagesKey) || [];
      
      return localMessages.sort((a, b) => 
        (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
      );
    }
  } else {
    // Production mode - Supabase only
    const client = getClient();
    const { data, error } = await client
      .from('messages')
      .select('id, chat_id, content, role, model, created_at, sequence_number, image_paths')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      model: message.model,
      createdAt: new Date(message.created_at),
      imagePaths: message.image_paths || []
    }));
  }
}

export async function createMessage(
  userId: string, 
  chatId: string, 
  message: Message, 
  sequenceNumber: number
): Promise<Message | null> {
  // In dev mode, try Supabase first but fall back to localStorage
  if (isDevMode()) {
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
        .select()
        .single();

      if (error) {
        console.warn('Error creating message in Supabase, using localStorage:', error);
        
        // Create a message in localStorage
        const newMessage = {
          id: `local-msg-${Date.now()}`,
          role: message.role,
          content: message.content,
          model: message.model,
          createdAt: new Date(),
          imagePaths: message.imagePaths || [],
          sequenceNumber
        };
        
        // Get existing messages for this chat
        const chatMessagesKey = `messages-${chatId}`;
        const existingMessages = getLocalStorageItem(chatMessagesKey) || [];
        const updatedMessages = [...existingMessages, newMessage];
        setLocalStorageItem(chatMessagesKey, updatedMessages);
        
        // Also update the messages in the chat list for this user
        const userChatsKey = `chats-${userId}`;
        const existingChats = getLocalStorageItem(userChatsKey) || [];
        const updatedChats = existingChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...(chat.messages || []), newMessage]
            };
          }
          return chat;
        });
        setLocalStorageItem(userChatsKey, updatedChats);
        
        return newMessage;
      }

      return {
        id: data.id,
        role: data.role,
        content: data.content,
        model: data.model,
        createdAt: new Date(data.created_at),
        imagePaths: data.image_paths || []
      };
    } catch (error) {
      console.warn('Error creating message, using localStorage:', error);
      
      // Create a message in localStorage
      const newMessage = {
        id: `local-msg-${Date.now()}`,
        role: message.role,
        content: message.content,
        model: message.model,
        createdAt: new Date(),
        imagePaths: message.imagePaths || [],
        sequenceNumber
      };
      
      // Get existing messages for this chat
      const chatMessagesKey = `messages-${chatId}`;
      const existingMessages = getLocalStorageItem(chatMessagesKey) || [];
      const updatedMessages = [...existingMessages, newMessage];
      setLocalStorageItem(chatMessagesKey, updatedMessages);
      
      // Also update the messages in the chat list for this user
      const userChatsKey = `chats-${userId}`;
      const existingChats = getLocalStorageItem(userChatsKey) || [];
      const updatedChats = existingChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...(chat.messages || []), newMessage]
          };
        }
        return chat;
      });
      setLocalStorageItem(userChatsKey, updatedChats);
      
      return newMessage;
    }
  } else {
    // Production mode - Supabase only
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
      console.error('Error creating message:', error);
      return null;
    }

    return {
      id: data.id,
      role: data.role,
      content: data.content,
      model: data.model,
      createdAt: new Date(data.created_at),
      imagePaths: data.image_paths || []
    };
  }
}

export async function deleteMessages(userId: string, chatId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('messages')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  return !error;
}