// be/src/models/index.ts
import { generateOpenAIResponse, Message as OpenAIMessage } from './openai';
import { generateAnthropicResponse, Message as AnthropicMessage } from './anthropic';
import { generateGoogleResponse, Message as GoogleMessage } from './google';

// Unified Message type
export type Message = {
  role: string;
  content: string;
};

// Model providers
export type ModelProvider = 'openai' | 'anthropic' | 'google';

// Get provider from model name
export function getProviderFromModel(model: string): ModelProvider {
  if (model.startsWith('gpt-')) {
    return 'openai';
  } else if (model.startsWith('claude-')) {
    return 'anthropic';
  } else if (model.startsWith('gemini-')) {
    return 'google';
  } else {
    // Default to OpenAI if unknown
    console.warn(`Unknown model: ${model}, defaulting to OpenAI`);
    return 'openai';
  }
}

// Generate response based on provider
export async function generateResponse(
  messages: Message[],
  model: string,
  apiKeys: Record<string, string>
): Promise<string> {
  const provider = getProviderFromModel(model);
  
  // Check for development fallback keys - broader matching for all dev keys
  const isDevFallbackKey = (key: string) => {
    return key && (
      key.includes('fallback-development-key') || 
      key.startsWith('sk-fallback') ||
      key === 'DEVELOPMENT_MODE_API_KEY' ||
      key.includes('sk-ant-fallback') ||
      key.includes('AIza-fallback') ||
      key.includes('sk-default-dev-key') ||
      key.includes('dev-key-for-testing')
    );
  };
  
  switch (provider) {
    case 'openai':
      // Check if we have a server-side fallback key
      const serverApiKey = process.env.OPENAI_API_KEY;
      
      // Use client key, server key, or fail
      if (!apiKeys.openai && !serverApiKey) {
        console.log('No OpenAI API key provided (client or server)');
        
        // Return a mock response in this case
        return "This is a development mode response. Please provide a valid OpenAI API key in settings to use the actual API. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // For dev fallback keys, return a mock response instead of making API call
      if (isDevFallbackKey(apiKeys.openai)) {
        console.log('Using development fallback for OpenAI API call');
        return "This is a development mode response using a placeholder API key. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // Use the client key if provided, otherwise use the server key
      const effectiveKey = apiKeys.openai || serverApiKey;
      return generateOpenAIResponse(messages as OpenAIMessage[], model, effectiveKey as string);
    
    case 'anthropic':
      // Check if we have a server-side fallback key
      const serverAnthropicKey = process.env.ANTHROPIC_API_KEY;
      
      // Use client key, server key, or fail
      if (!apiKeys.anthropic && !serverAnthropicKey) {
        console.log('No Anthropic API key provided (client or server)');
        
        // Return a mock response in this case
        return "This is a development mode response. Please provide a valid Anthropic API key in settings to use the actual API. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // For dev fallback keys, return a mock response instead of making API call
      if (isDevFallbackKey(apiKeys.anthropic)) {
        console.log('Using development fallback for Anthropic API call');
        return "This is a development mode response using a placeholder API key. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // Use the client key if provided, otherwise use the server key
      const effectiveAnthropicKey = apiKeys.anthropic || serverAnthropicKey;
      return generateAnthropicResponse(messages as AnthropicMessage[], model, effectiveAnthropicKey as string);
    
    case 'google':
      // Check if we have a server-side fallback key
      const serverGoogleKey = process.env.GOOGLE_API_KEY;
      
      // Use client key, server key, or fail
      if (!apiKeys.google && !serverGoogleKey) {
        console.log('No Google API key provided (client or server)');
        
        // Return a mock response in this case
        return "This is a development mode response. Please provide a valid Google API key in settings to use the actual API. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // For dev fallback keys, return a mock response instead of making API call
      if (isDevFallbackKey(apiKeys.google)) {
        console.log('Using development fallback for Google API call');
        return "This is a development mode response using a placeholder API key. Your message was: " + 
          (messages.find(m => m.role === 'user')?.content || 'No user message found');
      }
      
      // Use the client key if provided, otherwise use the server key
      const effectiveGoogleKey = apiKeys.google || serverGoogleKey;
      return generateGoogleResponse(messages as GoogleMessage[], model, effectiveGoogleKey as string);
    
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}

// Get available models
export function getAvailableModels(apiKeys: Record<string, string>): { id: string; name: string; provider: ModelProvider }[] {
  const models: { id: string; name: string; provider: ModelProvider }[] = [];
  
  // Check for development fallback keys - broader matching for all dev keys
  const isDevFallbackKey = (key: string) => {
    return key && (
      key.includes('fallback-development-key') || 
      key.startsWith('sk-fallback') ||
      key === 'DEVELOPMENT_MODE_API_KEY' ||
      key.includes('sk-ant-fallback') ||
      key.includes('AIza-fallback') ||
      key.includes('sk-default-dev-key') ||
      key.includes('dev-key-for-testing')
    );
  };
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        isDevFallbackKey(apiKeys.openai) || 
                        isDevFallbackKey(apiKeys.anthropic) ||
                        isDevFallbackKey(apiKeys.google);
  
  // OpenAI models
  if (apiKeys.openai || isDevelopment) {
    models.push(
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
    );
  }
  
  // Anthropic models
  if (apiKeys.anthropic || isDevelopment) {
    models.push(
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
    );
  }
  
  // Google models
  if (apiKeys.google || isDevelopment) {
    models.push(
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', provider: 'google' }
    );
  }
  
  return models;
}