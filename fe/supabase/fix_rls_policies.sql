-- This script fixes the Supabase RLS policies for development
-- Run this in the Supabase SQL editor

-- Define the dev UUID
\set dev_uuid '\'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11\''

-- ========== WORKSPACES TABLE ==========
-- Add RLS policy for dev user
DROP POLICY IF EXISTS "Allow dev user to select workspaces" ON workspaces;
CREATE POLICY "Allow dev user to select workspaces" ON workspaces
  FOR SELECT 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to insert workspaces" ON workspaces;
CREATE POLICY "Allow dev user to insert workspaces" ON workspaces
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to update workspaces" ON workspaces;
CREATE POLICY "Allow dev user to update workspaces" ON workspaces
  FOR UPDATE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to delete workspaces" ON workspaces;
CREATE POLICY "Allow dev user to delete workspaces" ON workspaces
  FOR DELETE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- ========== CHATS TABLE ==========
-- Add RLS policy for dev user
DROP POLICY IF EXISTS "Allow dev user to select chats" ON chats;
CREATE POLICY "Allow dev user to select chats" ON chats
  FOR SELECT 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to insert chats" ON chats;
CREATE POLICY "Allow dev user to insert chats" ON chats
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to update chats" ON chats;
CREATE POLICY "Allow dev user to update chats" ON chats
  FOR UPDATE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to delete chats" ON chats;
CREATE POLICY "Allow dev user to delete chats" ON chats
  FOR DELETE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- ========== MESSAGES TABLE ==========
-- Add RLS policy for dev user
DROP POLICY IF EXISTS "Allow dev user to select messages" ON messages;
CREATE POLICY "Allow dev user to select messages" ON messages
  FOR SELECT 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to insert messages" ON messages;
CREATE POLICY "Allow dev user to insert messages" ON messages
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to update messages" ON messages;
CREATE POLICY "Allow dev user to update messages" ON messages
  FOR UPDATE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to delete messages" ON messages;
CREATE POLICY "Allow dev user to delete messages" ON messages
  FOR DELETE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- ========== PROFILES TABLE ==========
-- Add RLS policy for dev user
DROP POLICY IF EXISTS "Allow dev user to select profiles" ON profiles;
CREATE POLICY "Allow dev user to select profiles" ON profiles
  FOR SELECT 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to update profiles" ON profiles;
CREATE POLICY "Allow dev user to update profiles" ON profiles
  FOR UPDATE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- ========== FOLDERS TABLE ==========
-- Add RLS policy for dev user
DROP POLICY IF EXISTS "Allow dev user to select folders" ON folders;
CREATE POLICY "Allow dev user to select folders" ON folders
  FOR SELECT 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to insert folders" ON folders;
CREATE POLICY "Allow dev user to insert folders" ON folders
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to update folders" ON folders;
CREATE POLICY "Allow dev user to update folders" ON folders
  FOR UPDATE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

DROP POLICY IF EXISTS "Allow dev user to delete folders" ON folders;
CREATE POLICY "Allow dev user to delete folders" ON folders
  FOR DELETE 
  USING (auth.uid() = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid OR user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);