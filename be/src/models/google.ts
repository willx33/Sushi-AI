// be/src/models/google.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Response type for Google Gemini API
export type GoogleResponse = {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
};

// Message type
export type Message = {
  role: string;
  content: string;
};

// Convert chat messages to Google Gemini format
function convertToGeminiFormat(messages: Message[]) {
  const contents: any[] = [];
  
  messages.forEach(msg => {
    // Convert role names to match Gemini API expectations
    let role = msg.role === 'user' ? 'user' : 'model';
    
    // Handle system messages by prepending to user message
    if (msg.role === 'system') {
      contents.push({
        role: 'user',
        parts: [{ text: 'Instructions for how you should respond: ' + msg.content }]
      });
    } else {
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }
  });
  
  return contents;
}

export async function generateGoogleResponse(
  messages: Message[],
  model: string = 'gemini-1.5-pro',
  apiKey: string
): Promise<string> {
  try {
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: convertToGeminiFormat(messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    };
    
    const response = await axios.post<GoogleResponse>(
      apiEndpoint,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Google response received from model: ${model}`);
    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error('Error communicating with Google API:', error.response?.data || error);
    if (error.response?.status === 429) {
      throw new Error('Rate limit reached with Google API, please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid API key provided for Google.');
    } else {
      throw new Error('Failed to get response from Google: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}