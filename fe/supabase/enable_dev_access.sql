-- This file enables development access to tables when using our dev UUID
-- Run this with:
-- psql -U postgres -d your_database_name -f enable_dev_access.sql

-- The dev UUID used in AuthContext.tsx
DROP EXTENSION IF EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the dev UUID
\set dev_uuid 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

-- Add dev user to auth.users if it doesn't exist (this might require superuser privileges)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = :'dev_uuid'::uuid) THEN
    INSERT INTO auth.users (id, email, role)
    VALUES (:'dev_uuid'::uuid, 'dev@example.com', 'authenticated');
  END IF;
END $$;

-- Create new RLS policies for workspaces
DROP POLICY IF EXISTS "Allow development access" ON workspaces;
CREATE POLICY "Allow development access" ON workspaces 
  USING (user_id = :'dev_uuid'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts" ON workspaces;
CREATE POLICY "Allow development inserts" ON workspaces 
  FOR INSERT WITH CHECK (user_id = :'dev_uuid'::uuid);

-- Create new RLS policies for chats
DROP POLICY IF EXISTS "Allow development access to chats" ON chats;
CREATE POLICY "Allow development access to chats" ON chats 
  USING (user_id = :'dev_uuid'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts to chats" ON chats;
CREATE POLICY "Allow development inserts to chats" ON chats 
  FOR INSERT WITH CHECK (user_id = :'dev_uuid'::uuid);

-- Create new RLS policies for messages
DROP POLICY IF EXISTS "Allow development access to messages" ON messages;
CREATE POLICY "Allow development access to messages" ON messages 
  USING (user_id = :'dev_uuid'::uuid);
  
DROP POLICY IF EXISTS "Allow development inserts to messages" ON messages;
CREATE POLICY "Allow development inserts to messages" ON messages 
  FOR INSERT WITH CHECK (user_id = :'dev_uuid'::uuid);

-- Create a home workspace for the dev user if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workspaces WHERE user_id = :'dev_uuid'::uuid AND is_home = true) THEN
    INSERT INTO workspaces (
      id, user_id, name, description, is_home, 
      default_model, default_prompt, default_temperature, default_context_length
    ) VALUES (
      uuid_generate_v4(), :'dev_uuid'::uuid, 'Home', 'Default workspace', true,
      'gpt-4o-mini', 'You are a helpful assistant.', 0.7, 4000
    );
  END IF;
END $$;