// fe/src/db/workspaces.ts
import { supabase } from '../lib/supabase/client';
import { isDevMode, getLocalStorageItem, setLocalStorageItem } from '@/lib/utils';

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
    
    // First check if we have a workspace in localStorage
    const localWorkspace = getLocalStorageItem(`home-workspace-${userId}`);
    if (localWorkspace) {
      console.log('Found workspace in localStorage:', localWorkspace.id);
      return localWorkspace;
    }
    
    // Check if we're in dev mode
    if (isDevMode()) {
      try {
        // Try Supabase with a short timeout
        console.log('Checking Supabase for workspace');
        
        // Use a promise with timeout to avoid hanging
        const fetchPromise = new Promise<Workspace|null>(async (resolve) => {
          try {
            const { data, error } = await supabase
              .from('workspaces')
              .select('id, name, description, is_home, default_model, default_prompt, default_temperature, default_context_length, created_at, updated_at')
              .eq('user_id', userId)
              .eq('is_home', true)
              .single();
            
            if (error) {
              if (error.code === 'PGRST116') { // No rows returned
                console.log('No home workspace found in Supabase. Creating one...');
                const newWorkspace = await createWorkspace(userId, {
                  name: 'Home',
                  description: 'Default workspace',
                  isHome: true,
                  defaultModel: 'gpt-4o-mini',
                  defaultPrompt: 'You are a helpful assistant.',
                  defaultTemperature: 0.7,
                  defaultContextLength: 4000
                });
                resolve(newWorkspace);
              } else {
                console.warn('Error fetching home workspace from Supabase:', error);
                resolve(null);
              }
            } else {
              console.log('Found existing home workspace in Supabase:', data.id);
              const workspace = {
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
              resolve(workspace);
            }
          } catch (error) {
            console.warn('Unexpected error in Supabase query:', error);
            resolve(null);
          }
        });
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Workspace|null>((resolve) => {
          setTimeout(() => {
            console.log('Supabase workspace fetch timed out');
            resolve(null);
          }, 3000);
        });
        
        // Race the promises
        const workspace = await Promise.race([fetchPromise, timeoutPromise]);
        
        // If we got a workspace, return it
        if (workspace) {
          // Save to localStorage for future quick access
          setLocalStorageItem(`home-workspace-${userId}`, workspace);
          return workspace;
        }
      } catch (error) {
        console.warn('Error in Supabase workspace fetch:', error);
      }
      
      // If we get here, create a local workspace
      console.log('Creating fallback local workspace');
      const newLocalWorkspace = {
        id: `local-workspace-${Date.now()}`,
        name: 'Home',
        description: 'Default workspace',
        isHome: true,
        defaultModel: 'gpt-4o-mini',
        defaultPrompt: 'You are a helpful assistant.',
        defaultTemperature: 0.7,
        defaultContextLength: 4000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in localStorage
      setLocalStorageItem(`home-workspace-${userId}`, newLocalWorkspace);
      
      return newLocalWorkspace;
    } else {
      // Production mode - Try Supabase with fallback
      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name, description, is_home, default_model, default_prompt, default_temperature, default_context_length, created_at, updated_at')
          .eq('user_id', userId)
          .eq('is_home', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // No rows returned
            console.log('No home workspace found. Creating one...');
            const newWorkspace = await createWorkspace(userId, {
              name: 'Home',
              description: 'Default workspace',
              isHome: true,
              defaultModel: 'gpt-4o-mini',
              defaultPrompt: 'You are a helpful assistant.',
              defaultTemperature: 0.7,
              defaultContextLength: 4000
            });
            
            if (newWorkspace) {
              // Save to localStorage
              setLocalStorageItem(`home-workspace-${userId}`, newWorkspace);
            }
            
            return newWorkspace;
          }
          
          console.error('Error fetching home workspace:', error);
          
          // Create a fallback
          const fallbackWorkspace = {
            id: `local-workspace-${Date.now()}`,
            name: 'Home',
            description: 'Default workspace',
            isHome: true,
            defaultModel: 'gpt-4o-mini',
            defaultPrompt: 'You are a helpful assistant.',
            defaultTemperature: 0.7,
            defaultContextLength: 4000,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Save to localStorage
          setLocalStorageItem(`home-workspace-${userId}`, fallbackWorkspace);
          
          return fallbackWorkspace;
        }
        
        console.log('Found existing home workspace:', data.id);
        const workspace = {
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
        
        // Save to localStorage
        setLocalStorageItem(`home-workspace-${userId}`, workspace);
        
        return workspace;
      } catch (error) {
        console.error('Error in Supabase workspace fetch:', error);
        
        // Create a fallback
        const fallbackWorkspace = {
          id: `local-workspace-${Date.now()}`,
          name: 'Home',
          description: 'Default workspace',
          isHome: true,
          defaultModel: 'gpt-4o-mini',
          defaultPrompt: 'You are a helpful assistant.',
          defaultTemperature: 0.7,
          defaultContextLength: 4000,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save to localStorage
        setLocalStorageItem(`home-workspace-${userId}`, fallbackWorkspace);
        
        return fallbackWorkspace;
      }
    }
  } catch (error) {
    console.error("Unexpected error in getHomeWorkspace:", error);
    
    // Create a fallback workspace as last resort
    const fallbackWorkspace = {
      id: `emergency-workspace-${Date.now()}`,
      name: 'Home',
      description: 'Default workspace',
      isHome: true,
      defaultModel: 'gpt-4o-mini',
      defaultPrompt: 'You are a helpful assistant.',
      defaultTemperature: 0.7,
      defaultContextLength: 4000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return fallbackWorkspace;
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