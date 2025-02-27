// fe/src/db/workspaces.ts
import { supabase } from '../lib/supabase/client';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  isHome: boolean;
  defaultModel: string;
  defaultPrompt: string;
  defaultTemperature: number;
  defaultContextLength: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, description, is_home, default_model, default_prompt, default_temperature, default_context_length, created_at, updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }

    return data.map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      isHome: workspace.is_home,
      defaultModel: workspace.default_model,
      defaultPrompt: workspace.default_prompt,
      defaultTemperature: workspace.default_temperature,
      defaultContextLength: workspace.default_context_length,
      createdAt: new Date(workspace.created_at),
      updatedAt: new Date(workspace.updated_at)
    }));
  } catch (error) {
    console.error('Unexpected error fetching workspaces:', error);
    return [];
  }
}

export async function getHomeWorkspace(userId: string): Promise<Workspace | null> {
  try {
    console.log(`Looking for home workspace for user: ${userId}`);
    
    // First check if any home workspace exists
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, description, is_home, default_model, default_prompt, default_temperature, default_context_length, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_home', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('No home workspace found. Creating one...');
        return createWorkspace(userId, {
          name: 'Home',
          description: 'Default workspace',
          isHome: true,
          defaultModel: 'gpt-4o-mini',
          defaultPrompt: 'You are a helpful assistant.',
          defaultTemperature: 0.7,
          defaultContextLength: 4000
        });
      }
      
      console.error('Error fetching home workspace:', error);
      return null;
    }
    
    console.log('Found existing home workspace:', data.id);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isHome: data.is_home,
      defaultModel: data.default_model,
      defaultPrompt: data.default_prompt,
      defaultTemperature: data.default_temperature,
      defaultContextLength: data.default_context_length,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error("Unexpected error in getHomeWorkspace:", error);
    return null;
  }
}

export async function createWorkspace(userId: string, workspace: Partial<Workspace>): Promise<Workspace | null> {
  try {
    console.log(`Creating workspace for user: ${userId}`);
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: userId,
        name: workspace.name || 'New Workspace',
        description: workspace.description || '',
        is_home: workspace.isHome || false,
        default_model: workspace.defaultModel || 'gpt-4o-mini',
        default_prompt: workspace.defaultPrompt || 'You are a helpful assistant.',
        default_temperature: workspace.defaultTemperature || 0.7,
        default_context_length: workspace.defaultContextLength || 4000
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workspace:', error);
      return null;
    }

    console.log("Created workspace:", data.id);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isHome: data.is_home,
      defaultModel: data.default_model,
      defaultPrompt: data.default_prompt,
      defaultTemperature: data.default_temperature,
      defaultContextLength: data.default_context_length,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Unexpected error in createWorkspace:', error);
    return null;
  }
}