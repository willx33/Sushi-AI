// be/src/models/openai.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Response type for OpenAI API
export type OpenAIResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
};

// Request type for OpenAI API
export type Message = {
  role: string;
  content: string;
};

export async function generateOpenAIResponse(
  messages: Message[],
  model: string = 'gpt-4o-mini',
  apiKey: string
): Promise<string> {
  try {
    const openAiResponse = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`OpenAI response received from model: ${model}`);
    return openAiResponse.data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error communicating with OpenAI API:', error.response?.data || error);
    if (error.response?.status === 429) {
      throw new Error('Rate limit reached with OpenAI API, please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid API key provided for OpenAI.');
    } else {
      throw new Error('Failed to get response from OpenAI: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}