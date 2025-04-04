# Sushi AI 🍣

## Install

```bash
cd be && npm install
cd ../fe && npm install

# Configure environment
cp be/.env.example be/.env
cp fe/.env.example fe/.env
```

## How To Use

```bash
# Start backend
cd be && npm run dev

# Start frontend
cd fe && npm run dev

# Setup Supabase
# Run schema.sql from fe/supabase/schema.sql
```

## Features
- **Multi-model AI chat** with OpenAI, Claude, and Gemini
- **Database-backed** with Supabase PostgreSQL storage
- **User workspaces** for chat organization

## More Options

```bash
# Debug mode
NODE_ENV=development npm run dev

# Custom port
PORT=4000 npm run dev

# Run tests
cd fe && npm test
```
