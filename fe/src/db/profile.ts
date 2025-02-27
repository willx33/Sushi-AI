// fe/src/db/profile.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';

// Helper function to get the appropriate client
const getClient = () => {
  // Use supabaseAdmin if available, otherwise fall back to regular client
  return supabaseAdmin || supabase;
}

export interface Profile {
  id: string;
  user_id: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  mistralApiKey?: string;
  preferredLanguage: string;
  theme: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const client = getClient();
  const { data, error } = await client
    .from('profiles')
    .select('id, user_id, openai_api_key, anthropic_api_key, google_api_key, mistral_api_key, preferred_language, theme, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    openaiApiKey: data.openai_api_key,
    anthropicApiKey: data.anthropic_api_key,
    googleApiKey: data.google_api_key,
    mistralApiKey: data.mistral_api_key,
    preferredLanguage: data.preferred_language || 'en',
    theme: data.theme || 'system',
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('profiles')
    .update({
      openai_api_key: updates.openaiApiKey,
      anthropic_api_key: updates.anthropicApiKey,
      google_api_key: updates.googleApiKey,
      mistral_api_key: updates.mistralApiKey,
      preferred_language: updates.preferredLanguage,
      theme: updates.theme
    })
    .eq('user_id', userId);

  return !error;
}

export async function createProfile(userId: string, profile: Partial<Profile>): Promise<Profile | null> {
  // Generate a UUID for the profile id
  const profileId = crypto.randomUUID();
  
  const client = getClient();
  const { data, error } = await client
    .from('profiles')
    .insert({
      id: profileId,
      user_id: userId,
      openai_api_key: profile.openaiApiKey,
      anthropic_api_key: profile.anthropicApiKey,
      google_api_key: profile.googleApiKey,
      mistral_api_key: profile.mistralApiKey,
      preferred_language: profile.preferredLanguage || 'en',
      theme: profile.theme || 'system'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    openaiApiKey: data.openai_api_key,
    anthropicApiKey: data.anthropic_api_key,
    googleApiKey: data.google_api_key,
    mistralApiKey: data.mistral_api_key,
    preferredLanguage: data.preferred_language,
    theme: data.theme,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}