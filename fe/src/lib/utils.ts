import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { consumeStream } from "./consume-stream";
import { Message } from "@/types/chat";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Check if we're in dev mode by looking at the URL
export function isDevMode() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('.local');
}

// Get item from localStorage with prefix
export function getLocalStorageItem(key: string) {
  const prefixedKey = `sushi-ai:${key}`;
  const item = localStorage.getItem(prefixedKey);
  return item ? JSON.parse(item) : null;
}

// Set item in localStorage with prefix
export function setLocalStorageItem(key: string, value: any) {
  const prefixedKey = `sushi-ai:${key}`;
  localStorage.setItem(prefixedKey, JSON.stringify(value));
}

// Remove item from localStorage with prefix
export function removeLocalStorageItem(key: string) {
  const prefixedKey = `sushi-ai:${key}`;
  localStorage.removeItem(prefixedKey);
}

/**
 * Send a streaming chat request to the API
 */
export async function streamChat(
  history: Message[],
  model: string,
  chatId?: string,
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    google?: string;
  },
  abortController?: AbortController
): Promise<{ 
  response: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}> {
  let responseText = '';
  let resolveResponse: (value: string) => void;
  let rejectResponse: (reason: Error) => void;
  
  // Create a promise that will be resolved when streaming is complete
  const responsePromise = new Promise<string>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });
  
  // Define handlers
  const onToken = (token: string) => {
    responseText += token;
  };
  
  const onComplete = () => {
    resolveResponse(responseText);
  };
  
  const onError = (error: Error) => {
    rejectResponse(error);
  };
  
  // Start the request
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      history,
      model,
      chatId,
      userId: localStorage.getItem('userId'),
      apiKey: apiKeys?.openai,
      anthropicApiKey: apiKeys?.anthropic,
      googleApiKey: apiKeys?.google
    }),
    signal: abortController?.signal
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    const error = new Error(errorData.error || 'Failed to stream chat response');
    onError(error);
    throw error;
  }

  // Start consuming the stream
  consumeStream(
    response,
    onToken,
    onComplete,
    onError
  );
  
  return {
    response: await responsePromise,
    onToken,
    onComplete,
    onError
  };
}