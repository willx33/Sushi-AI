// be/src/db/profile.ts
import { supabase } from '../lib/supabase/server-client';
import { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Get a user profile by ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a user profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Get the API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<{ 
  openai?: string | null; 
  anthropic?: string | null; 
  google?: string | null;
  mistral?: string | null;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('openai_api_key, anthropic_api_key, google_api_key, mistral_api_key')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching API keys:', error);
    return null;
  }
  
  return {
    openai: data.openai_api_key,
    anthropic: data.anthropic_api_key, 
    google: data.google_api_key,
    mistral: data.mistral_api_key
  };
}

/**
 * Update API keys for a user
 */
export async function updateApiKeys(
  userId: string, 
  keys: { 
    openai?: string | null; 
    anthropic?: string | null; 
    google?: string | null;
    mistral?: string | null;
  }
): Promise<boolean> {
  const updates: ProfileUpdate = {};
  if (keys.openai !== undefined) updates.openai_api_key = keys.openai;
  if (keys.anthropic !== undefined) updates.anthropic_api_key = keys.anthropic;
  if (keys.google !== undefined) updates.google_api_key = keys.google;
  if (keys.mistral !== undefined) updates.mistral_api_key = keys.mistral;
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating API keys:', error);
    return false;
  }
  
  return true;
}