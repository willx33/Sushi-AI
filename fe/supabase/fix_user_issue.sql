-- This script fixes the user foreign key constraint issues
-- Run this script to ensure the development user exists in auth.users before other tables

-- First, ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Check if the user exists in auth.users and create if not
DO $$
BEGIN
  -- Use a more complete insert that works with Supabase Auth requirements
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
    ) VALUES (
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

-- Step 2: Create profile if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) THEN
    INSERT INTO public.profiles (
      id,
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
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
      NULL, -- Leave API keys NULL or set them if you have values
      NULL,
      NULL,
      NULL,
      'en',
      'system',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Step 3: Create home workspace if needed
DO $$
DECLARE
  workspace_id uuid;
BEGIN
  -- Check if home workspace exists
  SELECT id INTO workspace_id 
  FROM public.workspaces 
  WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid 
  AND is_home = true
  LIMIT 1;
  
  -- If no workspace found, create one
  IF workspace_id IS NULL THEN
    INSERT INTO public.workspaces (
      id,
      user_id,
      name,
      description,
      is_home,
      default_model,
      default_prompt,
      default_temperature,
      default_context_length,
      created_at,
      updated_at
    )
    VALUES (
      uuid_generate_v4(),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
      'Home',
      'Default workspace',
      true,
      'gpt-4o-mini',
      'You are a helpful assistant.',
      0.7,
      4000,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Verify the user exists in all required tables
SELECT 'User check:' as status, EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) as exists;
SELECT 'Profile check:' as status, EXISTS (SELECT 1 FROM profiles WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) as exists;
SELECT 'Workspace check:' as status, EXISTS (SELECT 1 FROM workspaces WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AND is_home = true) as exists;