// be/src/models/stream.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

// Type for tokens callback
type OnTokenCallback = (token: string) => void;

// API Keys interface
interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

/**
 * Stream a response from an AI model
 */
export async function streamModelResponse(
  messages: any[], 
  model: string, 
  apiKeys: ApiKeys,
  onToken: OnTokenCallback
): Promise<void> {
  if (model.startsWith('gpt-')) {
    return streamOpenAIResponse(messages, model, onToken, apiKeys.openai);
  } else if (model.startsWith('claude-')) {
    return streamAnthropicResponse(messages, model, onToken, apiKeys.anthropic);
  } else if (model.startsWith('gemini-')) {
    return streamGoogleResponse(messages, model, onToken, apiKeys.google);
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

/**
 * Stream a response from OpenAI
 */
async function streamOpenAIResponse(
  messages: any[], 
  model: string, 
  onToken: OnTokenCallback,
  apiKey?: string
): Promise<void> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: apiKey
  });

  const stream = await openai.chat.completions.create({
    model: model,
    messages: messages,
    stream: true
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      onToken(content);
    }
  }
}

/**
 * Stream a response from Anthropic
 */
async function streamAnthropicResponse(
  messages: any[], 
  model: string, 
  onToken: OnTokenCallback,
  apiKey?: string
): Promise<void> {
  if (!apiKey) {
    throw new Error('Anthropic API key is required');
  }

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  // Using the legacy completions API since this version of the SDK doesn't support messages API
  const stream = await anthropic.completions.create({
    model: model,
    prompt: constructAnthropicPrompt(messages),
    max_tokens_to_sample: 4000,
    stream: true
  });

  for await (const chunk of stream) {
    if (chunk.completion) {
      onToken(chunk.completion);
    }
  }
}

/**
 * Stream a response from Google
 */
async function streamGoogleResponse(
  messages: any[], 
  model: string, 
  onToken: OnTokenCallback,
  apiKey?: string
): Promise<void> {
  if (!apiKey) {
    throw new Error('Google API key is required');
  }

  // Format messages for Google
  const formattedMessages = convertToGoogleMessages(messages);

  try {
    // Using axios directly to make a streaming request to Google
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}`,
      {
        contents: formattedMessages
      },
      {
        responseType: 'stream'
      }
    );

    const stream = response.data;

    return new Promise((resolve, reject) => {
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        const data = chunk.toString();
        buffer += data;

        // Process complete JSON objects
        let startIdx = 0;
        let endIdx;

        while ((endIdx = buffer.indexOf('}\n', startIdx)) !== -1) {
          const jsonStr = buffer.substring(startIdx, endIdx + 1);
          startIdx = endIdx + 2;

          try {
            const parsedData = JSON.parse(jsonStr);
            
            if (parsedData.candidates && 
                parsedData.candidates[0] && 
                parsedData.candidates[0].content && 
                parsedData.candidates[0].content.parts && 
                parsedData.candidates[0].content.parts[0].text) {
              onToken(parsedData.candidates[0].content.parts[0].text);
            }
          } catch (error) {
            console.error('Failed to parse Google response chunk:', error);
          }
        }

        // Keep any remaining incomplete JSON for the next data event
        buffer = buffer.substring(startIdx);
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error streaming from Google:', error);
    throw error;
  }
}

/**
 * Construct a prompt string for Anthropic's older completions API
 */
function constructAnthropicPrompt(messages: any[]): string {
  let prompt = '';
  let hasUserMessage = false;
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      prompt += msg.content + '\n\n';
    } else if (msg.role === 'user') {
      prompt += '\n\nHuman: ' + msg.content;
      hasUserMessage = true;
    } else if (msg.role === 'assistant') {
      prompt += '\n\nAssistant: ' + msg.content;
    }
  }
  
  // Ensure the prompt ends with "Assistant: " for the model to continue
  if (!prompt.endsWith('Assistant: ') && hasUserMessage) {
    prompt += '\n\nAssistant: ';
  }
  
  return prompt;
}

/**
 * Convert messages to Google format
 */
function convertToGoogleMessages(messages: any[]): any[] {
  const geminiMessages: any[] = [];
  let systemPrompt = '';

  // Extract system message if present
  const systemMessage = messages.find(msg => msg.role === 'system');
  if (systemMessage) {
    systemPrompt = systemMessage.content;
  }

  // Format user and assistant messages
  let currentRole = null;
  let currentParts: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;

    const role = msg.role === 'user' ? 'user' : 'model';

    if (currentRole === null) {
      // First message
      currentRole = role;
      currentParts.push({ text: msg.content });
    } else if (currentRole === role) {
      // Same role as previous message, append to parts
      currentParts.push({ text: msg.content });
    } else {
      // Role changed, add previous message and start a new one
      geminiMessages.push({
        role: currentRole,
        parts: currentParts
      });
      currentRole = role;
      currentParts = [{ text: msg.content }];
    }
  }

  // Add the last message
  if (currentRole !== null) {
    geminiMessages.push({
      role: currentRole,
      parts: currentParts
    });
  }

  // If we have a system prompt, add it to the first user message
  if (systemPrompt && geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
    const firstUserMessage = geminiMessages[0].parts[0].text;
    geminiMessages[0].parts[0].text = `${systemPrompt}\n\n${firstUserMessage}`;
  }

  return geminiMessages;
}