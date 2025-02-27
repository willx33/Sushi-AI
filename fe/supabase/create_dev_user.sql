-- This script creates a development user in the Supabase auth.users table
-- Run this in your Supabase SQL editor

-- First, ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- IMPORTANT: Fix the foreign key constraint issues by first creating the user
DO $$
BEGIN
  -- Check if the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) THEN
    -- Insert dev user into auth.users table
    INSERT INTO auth.users (
      id,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at,
      role
    ) VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
      'dev@example.com',
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      'authenticated'
    );
  END IF;
END $$;

-- Create a profile for the dev user if it doesn't exist
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

-- Create a home workspace for the dev user if it doesn't exist
DO $$
DECLARE
  workspace_id uuid;
BEGIN
  -- First check if a home workspace exists
  SELECT id INTO workspace_id 
  FROM public.workspaces 
  WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid 
  AND is_home = true
  LIMIT 1;
  
  -- If no workspace found, create one
  IF workspace_id IS NULL THEN
    workspace_id := uuid_generate_v4();
    
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
      workspace_id,
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
    
    -- Create a sample chat in this workspace
    INSERT INTO public.chats (
      id,
      user_id,
      workspace_id,
      name,
      model,
      prompt,
      temperature,
      created_at,
      updated_at
    )
    VALUES (
      uuid_generate_v4(),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
      workspace_id,
      'Welcome Chat',
      'gpt-4o-mini',
      'You are a helpful assistant.',
      0.7,
      NOW(),
      NOW()
    );
  END IF;
END $$;