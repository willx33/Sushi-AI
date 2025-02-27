// be/src/models/anthropic.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Response type for Anthropic API
export type AnthropicResponse = {
  id: string;
  model: string;
  type: string;
  content: {
    type: string;
    text: string;
  }[];
};

// Message type
export type Message = {
  role: string;
  content: string;
};

// Convert chat messages to Anthropic format
function convertToAnthropicFormat(messages: Message[]) {
  return messages.map(msg => {
    const role = msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'user';
    return {
      role,
      content: msg.role === 'system' 
        ? [{ type: 'text', text: msg.content }]
        : [{ type: 'text', text: msg.content }]
    };
  });
}

export async function generateAnthropicResponse(
  messages: Message[],
  model: string = 'claude-3-haiku-20240307',
  apiKey: string
): Promise<string> {
  try {
    const systemMessage = messages.find(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    const requestBody: any = {
      model,
      messages: convertToAnthropicFormat(nonSystemMessages),
      max_tokens: 4096
    };
    
    // Add system instruction if present
    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }
    
    const response = await axios.post<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      requestBody,
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Anthropic response received from model: ${model}`);
    return response.data.content[0].text;
  } catch (error: any) {
    console.error('Error communicating with Anthropic API:', error.response?.data || error);
    if (error.response?.status === 429) {
      throw new Error('Rate limit reached with Anthropic API, please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid API key provided for Anthropic.');
    } else {
      throw new Error('Failed to get response from Anthropic: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}