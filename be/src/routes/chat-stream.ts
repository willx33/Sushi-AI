// be/src/routes/chat-stream.ts
import express, { Request, Response } from 'express';
import { streamResponse } from '../lib/streaming/stream-response';
import { streamModelResponse } from '../models/stream';
import { createMessage } from '../db/messages';
import { updateChat } from '../db/chats';

const router = express.Router();

// Streaming chat endpoint
router.post('/', async (req: Request, res: Response) => {
  const { 
    history, 
    model = 'gpt-4o-mini', 
    chatId,
    userId,
    apiKey, 
    anthropicApiKey,
    googleApiKey,
    temperature = 0.7
  } = req.body;

  const apiKeys = {
    openai: apiKey,
    anthropic: anthropicApiKey,
    google: googleApiKey
  };

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Conversation history not provided' });
  }

  // The last message should be from the user
  const lastMessage = history[history.length - 1];
  if (lastMessage.role !== 'user') {
    return res.status(400).json({ error: 'Last message must be from the user' });
  }

  console.log(`Streaming request received for model: ${model}`);

  let accumulatedMessage = '';
  let messageId = '';

  return streamResponse(res, async (stream) => {
    try {
      // Create empty assistant message in database if chatId and userId are provided
      if (chatId && userId) {
        const newMessage = await createMessage({
          user_id: userId,
          chat_id: chatId,
          content: '',
          role: 'assistant',
          model: model,
          sequence_number: history.length
        });
        
        if (newMessage) {
          messageId = newMessage.id;
        }
        
        // Update chat's updated_at timestamp
        await updateChat(chatId, { updated_at: new Date().toISOString() });
      }

      // Stream the response from the model
      await streamModelResponse(history, model, apiKeys, (token) => {
        accumulatedMessage += token;
        stream.write(token);
      });

      // Update the message in the database with the complete text
      if (messageId && accumulatedMessage) {
        await updateMessage(messageId, { 
          content: accumulatedMessage
        });
      }
    } catch (error: any) {
      console.error('Error generating streaming response:', error);
      stream.write(error.message);
    }
  });
});

// Helper function to update the message
async function updateMessage(messageId: string, updates: { content: string }) {
  try {
    // Import from db to avoid circular dependencies
    const { updateMessage: dbUpdateMessage } = require('../db/messages');
    await dbUpdateMessage(messageId, updates);
  } catch (error) {
    console.error('Error updating message:', error);
  }
}

export default router;