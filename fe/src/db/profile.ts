// fe/src/db/profile.ts
import { supabase, supabaseAdmin } from '../lib/supabase/client';

// Helper function to get the appropriate client
const getClient = () => {
  // Always use the regular client for profile operations
  return supabase;
}

export interface Profile {
  id: string;
  user_id: string; // Added to match database schema
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
  try {
    console.log(`Getting profile for user ID: ${userId}`);
    
    const { data, error } = await client
      .from('profiles')
      .select('id, openai_api_key, anthropic_api_key, google_api_key, mistral_api_key, preferred_language, theme, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) {
      console.log('No profile found for user ID:', userId);
      return null;
    }

    console.log('Profile found:', data.id);
    
    return {
      id: data.id,
      user_id: userId, // Set user_id to match what was passed in
      openaiApiKey: data.openai_api_key,
      anthropicApiKey: data.anthropic_api_key,
      googleApiKey: data.google_api_key,
      mistralApiKey: data.mistral_api_key,
      preferredLanguage: data.preferred_language || 'en',
      theme: data.theme || 'system',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Unexpected error in getProfile:', error);
    return null;
  }
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
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
  }
  
  return !error;
}

export async function createProfile(userId: string, profile: Partial<Profile>): Promise<Profile | null> {
  const client = getClient();
  
  try {
    console.log(`Creating profile for user ID: ${userId}`);
    
    // First check if profile already exists
    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      console.log('Profile already exists, returning existing one');
      return existingProfile;
    }
    
    const { data, error } = await client
      .from('profiles')
      .insert({
        id: userId, // In our schema, id is the user's ID
        // No need to add user_id as it's not in the database schema
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
      
      // The profile might already exist due to the trigger in the SQL
      // Try fetching it one more time
      console.log('Attempting to fetch existing profile after insert error...');
      return getProfile(userId);
    }

    if (!data) {
      console.log('No data returned from profile creation');
      return null;
    }

    console.log('Profile created successfully:', data.id);
    
    return {
      id: data.id,
      user_id: userId, // Set user_id to match what was passed in
      openaiApiKey: data.openai_api_key,
      anthropicApiKey: data.anthropic_api_key,
      googleApiKey: data.google_api_key,
      mistralApiKey: data.mistral_api_key,
      preferredLanguage: data.preferred_language || 'en',
      theme: data.theme || 'system',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Unexpected error in createProfile:', error);
    
    // Last resort - create a memory-only profile
    console.log('Creating memory-only profile as fallback');
    return {
      id: userId,
      user_id: userId,
      openaiApiKey: profile.openaiApiKey,
      anthropicApiKey: profile.anthropicApiKey,
      googleApiKey: profile.googleApiKey,
      mistralApiKey: profile.mistralApiKey,
      preferredLanguage: profile.preferredLanguage || 'en',
      theme: profile.theme as 'light' | 'dark' | 'system' || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}