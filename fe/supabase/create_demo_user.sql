-- Create a demo user account for testing
INSERT INTO auth.users (
  instance_id, 
  id, 
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11',
  'demo@sushiai.app',
  crypt('sushi123demo', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create profile for the demo user
INSERT INTO public.profiles (
  id,
  user_id,
  openai_api_key,
  anthropic_api_key,
  google_api_key,
  mistral_api_key,
  preferred_language,
  theme,
  created_at,
  updated_at
)
VALUES (
  'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11',
  'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11',
  '',
  '',
  '',
  '',
  'en',
  'system',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create a default workspace for the demo user
INSERT INTO public.workspaces (
  id,
  name,
  user_id,
  is_home,
  created_at,
  updated_at
)
VALUES (
  '34d8ec99-1c7b-5ef9-aa6d-7bb9bd580c23',
  'Demo Workspace',
  'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11',
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Add RLS policies for the demo user
-- ========== WORKSPACES TABLE ==========
DROP POLICY IF EXISTS "Allow demo user to select workspaces" ON workspaces;
CREATE POLICY "Allow demo user to select workspaces" ON workspaces
  FOR SELECT 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to insert workspaces" ON workspaces;
CREATE POLICY "Allow demo user to insert workspaces" ON workspaces
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to update workspaces" ON workspaces;
CREATE POLICY "Allow demo user to update workspaces" ON workspaces
  FOR UPDATE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to delete workspaces" ON workspaces;
CREATE POLICY "Allow demo user to delete workspaces" ON workspaces
  FOR DELETE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

-- ========== CHATS TABLE ==========
DROP POLICY IF EXISTS "Allow demo user to select chats" ON chats;
CREATE POLICY "Allow demo user to select chats" ON chats
  FOR SELECT 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to insert chats" ON chats;
CREATE POLICY "Allow demo user to insert chats" ON chats
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to update chats" ON chats;
CREATE POLICY "Allow demo user to update chats" ON chats
  FOR UPDATE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to delete chats" ON chats;
CREATE POLICY "Allow demo user to delete chats" ON chats
  FOR DELETE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

-- ========== MESSAGES TABLE ==========
DROP POLICY IF EXISTS "Allow demo user to select messages" ON messages;
CREATE POLICY "Allow demo user to select messages" ON messages
  FOR SELECT 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to insert messages" ON messages;
CREATE POLICY "Allow demo user to insert messages" ON messages
  FOR INSERT 
  WITH CHECK (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to update messages" ON messages;
CREATE POLICY "Allow demo user to update messages" ON messages
  FOR UPDATE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to delete messages" ON messages;
CREATE POLICY "Allow demo user to delete messages" ON messages
  FOR DELETE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR user_id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

-- ========== PROFILES TABLE ==========
DROP POLICY IF EXISTS "Allow demo user to select profiles" ON profiles;
CREATE POLICY "Allow demo user to select profiles" ON profiles
  FOR SELECT 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

DROP POLICY IF EXISTS "Allow demo user to update profiles" ON profiles;
CREATE POLICY "Allow demo user to update profiles" ON profiles
  FOR UPDATE 
  USING (auth.uid() = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid OR id = 'a5b0ec99-9c2b-4ef8-bb6d-6bb9bd580a11'::uuid);

-- Import this SQL file in your Supabase SQL editor to create the demo account
-- After running this, users can log in with:
-- Email: demo@sushiai.app
-- Password: sushi123demo