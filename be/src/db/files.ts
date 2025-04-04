// be/src/db/files.ts
import { supabase } from '../lib/supabase/server-client';
import { Database } from '../types/database.types';

type File = Database['public']['Tables']['files']['Row'];
type FileInsert = Database['public']['Tables']['files']['Insert'];
type FileUpdate = Database['public']['Tables']['files']['Update'];
type FileWorkspace = Database['public']['Tables']['file_workspaces']['Row'];
type FileWorkspaceInsert = Database['public']['Tables']['file_workspaces']['Insert'];
type FileItem = Database['public']['Tables']['file_items']['Row'];
type FileItemInsert = Database['public']['Tables']['file_items']['Insert'];

/**
 * Get a file by ID
 */
export async function getFileById(fileId: string): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();
  
  if (error) {
    console.error('Error fetching file:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all files for a workspace
 */
export async function getFilesByWorkspaceId(workspaceId: string): Promise<File[]> {
  const { data, error } = await supabase
    .from('file_workspaces')
    .select('file_id, files(*)')
    .eq('workspace_id', workspaceId);
  
  if (error) {
    console.error('Error fetching files:', error);
    return [];
  }
  
  // Extract files from the join result
  return data.map((item: any) => item.files);
}

/**
 * Create a new file
 */
export async function createFile(file: FileInsert): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .insert([file])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating file:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a file
 */
export async function updateFile(fileId: string, updates: FileUpdate): Promise<File | null> {
  const { data, error } = await supabase
    .from('files')
    .update(updates)
    .eq('id', fileId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating file:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);
  
  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  
  return true;
}

/**
 * Associate a file with a workspace
 */
export async function createFileWorkspace(fileWorkspace: FileWorkspaceInsert): Promise<FileWorkspace | null> {
  const { data, error } = await supabase
    .from('file_workspaces')
    .insert([fileWorkspace])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating file workspace:', error);
    return null;
  }
  
  return data;
}

/**
 * Remove a file from a workspace
 */
export async function deleteFileWorkspace(fileId: string, workspaceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('file_workspaces')
    .delete()
    .eq('file_id', fileId)
    .eq('workspace_id', workspaceId);
  
  if (error) {
    console.error('Error deleting file workspace:', error);
    return false;
  }
  
  return true;
}

/**
 * Create a file item (chunk)
 */
export async function createFileItem(fileItem: FileItemInsert): Promise<FileItem | null> {
  const { data, error } = await supabase
    .from('file_items')
    .insert([fileItem])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating file item:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all file items for a file
 */
export async function getFileItemsByFileId(fileId: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('file_items')
    .select('*')
    .eq('file_id', fileId);
  
  if (error) {
    console.error('Error fetching file items:', error);
    return [];
  }
  
  return data;
}

/**
 * Delete all file items for a file
 */
export async function deleteFileItemsByFileId(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('file_items')
    .delete()
    .eq('file_id', fileId);
  
  if (error) {
    console.error('Error deleting file items:', error);
    return false;
  }
  
  return true;
}