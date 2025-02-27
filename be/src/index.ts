// be/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { generateResponse, getAvailableModels } from "./models";

// Import routes
import filesRouter from './routes/files';
import chatStreamRouter from './routes/chat-stream';
import retrievalRouter from './routes/retrieval';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001; // Match with frontend VITE_API_URL

// Create necessary directories
const uploadsDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');
[uploadsDir, tempDir].forEach(dir => {
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
});

// Set up static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

// Set up routes
app.use('/api/files', filesRouter);
app.use('/api/chat/stream', chatStreamRouter);
app.use('/api/retrieval', retrievalRouter);

// Legacy chat endpoint (non-streaming)
app.post('/api/chat', async (req: Request, res: Response) => {
  // Expect history to be an array of messages from the frontend
  const { 
    history, 
    model = 'gpt-4o-mini',
    context,
    apiKey, 
    anthropicApiKey,
    googleApiKey,
    temperature = 0.7
  } = req.body;

  const apiKeys = {
    openai: apiKey,
    anthropic: anthropicApiKey,
    google: googleApiKey
  };

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Conversation history not provided' });
  }

  console.log(`Request received for model: ${model}`);

  try {
    // If context is provided, inject it into the system message or create one
    let enhancedHistory = [...history];
    
    if (context) {
      const systemMessageIndex = enhancedHistory.findIndex(msg => msg.role === 'system');
      
      if (systemMessageIndex >= 0) {
        // Append context to existing system message
        enhancedHistory[systemMessageIndex].content += '\n\n' + context;
      } else {
        // Create new system message with context
        enhancedHistory.unshift({
          role: 'system',
          content: context
        });
      }
    }
    
    const reply = await generateResponse(enhancedHistory, model, apiKeys);
    res.json({ response: reply });
  } catch (error: any) {
    console.error('Error generating response:', error.message);
    
    if (error.message.includes('API key')) {
      res.status(401).json({ error: error.message });
    } else if (error.message.includes('Rate limit')) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Models endpoint
app.post('/api/models', (req: Request, res: Response) => {
  const { apiKey, anthropicApiKey, googleApiKey } = req.body;
  
  const apiKeys = {
    openai: apiKey,
    anthropic: anthropicApiKey,
    google: googleApiKey
  };
  
  const models = getAvailableModels(apiKeys);
  res.json({ models });
});

// Profile API keys endpoint
app.get('/api/profile/:userId/keys', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Import here to avoid circular dependencies
    const { getUserApiKeys } = require('./db/profile');
    
    const keys = await getUserApiKeys(userId);
    
    if (!keys) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(keys);
  } catch (error: any) {
    console.error('Error fetching user API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update API keys endpoint
app.post('/api/profile/:userId/keys', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { openai, anthropic, google, mistral } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Import here to avoid circular dependencies
    const { updateApiKeys } = require('./db/profile');
    
    const success = await updateApiKeys(userId, {
      openai,
      anthropic,
      google,
      mistral
    });
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update API keys' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Sushi AI API is running', 
    endpoints: [
      '/api/health',
      '/api/chat',
      '/api/chat/stream',
      '/api/files',
      '/api/models',
      '/api/retrieval'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});