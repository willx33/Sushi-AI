-- This file enables development access to tables when using our dev UUID
-- Run this in your Supabase SQL editor

-- First, ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add dev user to auth.users if it doesn't exist (this might require superuser privileges)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) THEN
    INSERT INTO auth.users (
      id, 
      email, 
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at
    )
    VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 
      'dev@example.com', 
      'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      NOW(),
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Create new RLS policies for workspaces
DROP POLICY IF EXISTS "Allow development access" ON workspaces;
CREATE POLICY "Allow development access" ON workspaces 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts" ON workspaces;
CREATE POLICY "Allow development inserts" ON workspaces 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- Create new RLS policies for chats
DROP POLICY IF EXISTS "Allow development access to chats" ON chats;
CREATE POLICY "Allow development access to chats" ON chats 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts to chats" ON chats;
CREATE POLICY "Allow development inserts to chats" ON chats 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- Create new RLS policies for messages
DROP POLICY IF EXISTS "Allow development access to messages" ON messages;
CREATE POLICY "Allow development access to messages" ON messages 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts to messages" ON messages;
CREATE POLICY "Allow development inserts to messages" ON messages 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- Create a home workspace for the dev user if it doesn't exist
DO $$ 
DECLARE
  workspace_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workspaces WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND is_home = true) THEN
    workspace_id := uuid_generate_v4();
    
    INSERT INTO workspaces (
      id, 
      user_id, 
      name, 
      description, 
      is_home, 
      default_model, 
      default_prompt, 
      default_temperature, 
      default_context_length
    ) VALUES (
      workspace_id,
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 
      'Home', 
      'Default workspace', 
      true,
      'gpt-4o-mini', 
      'You are a helpful assistant.', 
      0.7, 
      4000
    );
  END IF;
END $$;