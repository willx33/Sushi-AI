-- Sushi AI Database Schema

-- Enable the vector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table to store user preferences and API keys
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  google_api_key TEXT,
  mistral_api_key TEXT,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own profile" ON profiles
  USING (auth.uid() = id);

-- Workspaces to organize chats
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_home BOOLEAN DEFAULT false,
  default_model TEXT DEFAULT 'gpt-4o-mini',
  default_prompt TEXT DEFAULT 'You are a helpful assistant.',
  default_temperature FLOAT DEFAULT 0.7,
  default_context_length INTEGER DEFAULT 4000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own workspaces" ON workspaces
  USING (auth.uid() = user_id);
  
-- Add policy to allow access with dev UUID
CREATE POLICY "Allow development access" ON workspaces 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  
-- Add policy to allow inserts with dev UUID
CREATE POLICY "Allow development inserts" ON workspaces 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Folders to organize chats within workspaces
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'chats',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own folders" ON folders
  USING (auth.uid() = user_id);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT,
  temperature FLOAT DEFAULT 0.7,
  context_length INTEGER DEFAULT 4000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own chats" ON chats
  USING (auth.uid() = user_id);
  
-- Add policy to allow access with dev UUID
CREATE POLICY "Allow development access to chats" ON chats 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  
-- Add policy to allow inserts with dev UUID
CREATE POLICY "Allow development inserts to chats" ON chats 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  model TEXT,
  sequence_number INTEGER NOT NULL,
  image_paths TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own messages" ON messages
  USING (auth.uid() = user_id);

-- Add policy to allow access with dev UUID
CREATE POLICY "Allow development access to messages" ON messages 
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  
-- Add policy to allow inserts with dev UUID
CREATE POLICY "Allow development inserts to messages" ON messages 
  FOR INSERT WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own files" ON files
  USING (auth.uid() = user_id);

-- File items (chunks) table
CREATE TABLE file_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for file items
ALTER TABLE file_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own file items" ON file_items
  USING (auth.uid() = user_id);

-- Workspace file relationships
CREATE TABLE file_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(file_id, workspace_id)
);

-- Enable RLS for file workspaces
ALTER TABLE file_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own file workspaces" ON file_workspaces
  USING (auth.uid() = user_id);

-- Create function to automatically create a home workspace for new users
CREATE OR REPLACE FUNCTION public.create_home_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspaces (user_id, name, description, is_home)
  VALUES (NEW.id, 'Home', 'Default workspace', true);
  
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create a home workspace when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_home_workspace();

-- Create function for semantic similarity search on embeddings
CREATE OR REPLACE FUNCTION match_file_items(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  file_id UUID,
  user_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    file_items.id,
    file_items.content,
    file_items.file_id,
    file_items.user_id,
    1 - (file_items.embedding <=> query_embedding) AS similarity
  FROM file_items
  WHERE 1 - (file_items.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;