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
  
  switch (provider) {
    case 'openai':
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key not provided');
      }
      return generateOpenAIResponse(messages as OpenAIMessage[], model, apiKeys.openai);
    
    case 'anthropic':
      if (!apiKeys.anthropic) {
        throw new Error('Anthropic API key not provided');
      }
      return generateAnthropicResponse(messages as AnthropicMessage[], model, apiKeys.anthropic);
    
    case 'google':
      if (!apiKeys.google) {
        throw new Error('Google API key not provided');
      }
      return generateGoogleResponse(messages as GoogleMessage[], model, apiKeys.google);
    
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}

// Get available models
export function getAvailableModels(apiKeys: Record<string, string>): { id: string; name: string; provider: ModelProvider }[] {
  const models: { id: string; name: string; provider: ModelProvider }[] = [];
  
  // OpenAI models
  if (apiKeys.openai) {
    models.push(
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
    );
  }
  
  // Anthropic models
  if (apiKeys.anthropic) {
    models.push(
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
    );
  }
  
  // Google models
  if (apiKeys.google) {
    models.push(
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', provider: 'google' }
    );
  }
  
  return models;
}