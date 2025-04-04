# Sushi AI 🍣

A modern AI chat application supporting multiple models and providing a robust, database-backed user experience.

## Features

- **Multiple AI Models**: Support for OpenAI, Anthropic Claude, and Google Gemini models
- **Database Integration**: Supabase PostgreSQL database for persistent storage
- **User Authentication**: Secure user accounts and API key management
- **Workspace Organization**: Organize chats with workspaces and folders
- **Theme Options**: Light, dark, and system themes
- **Multi-device Support**: Access your chats from any device

## Technology Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- React Router

### Backend
- Node.js with Express
- TypeScript
- Supabase integration

### AI Integration
- OpenAI API (GPT-4o, GPT-4 Turbo, etc.)
- Anthropic API (Claude 3 models)
- Google AI API (Gemini models)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- API keys for the AI providers you want to use

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/sushi-ai.git
cd sushi-ai
```

2. Install dependencies for both frontend and backend
```
# Install backend dependencies
cd be
npm install

# Install frontend dependencies
cd ../fe
npm install
```

3. Create environment files
   - Copy `be/.env.example` to `be/.env` and update with your values
   - Copy `fe/.env.example` to `fe/.env` and update with your Supabase values

4. Set up Supabase
   - Create a new Supabase project
   - Run the schema SQL from `fe/supabase/schema.sql` in the SQL editor

5. Start the development servers
```
# Start backend
cd be
npm run dev

# Start frontend (in another terminal)
cd fe
npm run dev
```

## Architecture

The application is split into frontend and backend:

- **Frontend**: React application with TypeScript that handles UI rendering, state management, and API communication
- **Backend**: Express server that provides API endpoints for chat completions and model information

Data is stored in Supabase (PostgreSQL) with the following main tables:
- `profiles`: User settings and API keys
- `workspaces`: Organization units for chats
- `chats`: Individual conversations
- `messages`: Chat messages
- `files`: Uploaded documents (future feature)

## Future Enhancements

- File upload and RAG (Retrieval Augmented Generation)
- Chat sharing
- Chat search
- Message annotations
- Custom tools and plugins
- Mobile app support

## License

[MIT License](LICENSE)