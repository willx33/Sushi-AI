// be/src/db/workspaces.ts
import { supabase } from '../lib/supabase/server-client';
import { Database } from '../types/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update'];

/**
 * Get a workspace by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();
  
  if (error) {
    console.error('Error fetching workspace:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all workspaces for a user
 */
export async function getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('is_home', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }
  
  return data;
}

/**
 * Get home workspace for a user
 */
export async function getHomeWorkspace(userId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .eq('is_home', true)
    .single();
  
  if (error) {
    console.error('Error fetching home workspace:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(workspace: WorkspaceInsert): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert([workspace])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating workspace:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a workspace
 */
export async function updateWorkspace(workspaceId: string, updates: WorkspaceUpdate): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating workspace:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);
  
  if (error) {
    console.error('Error deleting workspace:', error);
    return false;
  }
  
  return true;
}