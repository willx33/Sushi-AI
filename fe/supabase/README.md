# Supabase Setup and Troubleshooting

This directory contains SQL scripts to set up and manage your Supabase database for the Sushi AI application.

## Common Issues

### Foreign Key Constraint Errors

If you're seeing errors like this:
```
Error creating workspace: {code: '23503', details: 'Key (user_id)=(a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11) is not present in table "users".', hint: null, message: 'insert or update on table "workspaces" violates foreign key constraint "workspaces_user_id_fkey"'}
```

This occurs because the application is trying to create records in tables like `workspaces` or `messages` with a user ID that doesn't exist in the `auth.users` table.

## Fix

Run the `fix_user_issue.sql` script in your Supabase SQL editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `fix_user_issue.sql` and run it
4. Verify the output shows that the user exists in all required tables

This script will:
1. Create the dev user in `auth.users` if it doesn't exist
2. Create a profile for the dev user in `profiles` if it doesn't exist
3. Create a home workspace for the dev user if it doesn't exist

## Development Mode

In development mode, the application uses a hardcoded UUID (`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`) for the user. This is set in `fe/src/context/AuthContext.tsx`.

## Database Setup Scripts

- `schema.sql` - Main database schema
- `create_dev_user.sql` - Creates development user
- `enable_dev_access.sql` - Sets up RLS policies for development
- `fix_user_issue.sql` - Fixes foreign key constraint issues

## Usage

After cloning the repository or setting up a new Supabase instance:

1. Run `schema.sql` to create all necessary tables
2. Run `fix_user_issue.sql` to ensure the dev user exists
3. The application should now work correctly with the development user