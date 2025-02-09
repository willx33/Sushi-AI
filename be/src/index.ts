// be/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
// The .env file is expected to be in the parent directory of dist (i.e. in the "be" folder)
const envFilePath = join(__dirname, "../.env");

// ----- API Key Endpoints -----

// Save the API key to .env
app.post('/api/apikey', (req: Request, res: Response) => {
  const { apiKey } = req.body;
  try {
    writeFileSync(envFilePath, `OPENAI_API_KEY=${apiKey}\n`);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Read the API key from .env
app.get('/api/apikey', (req: Request, res: Response) => {
  try {
    if (!existsSync(envFilePath)) return res.json({ apiKey: "" });
    const envContent = readFileSync(envFilePath, 'utf-8');
    const apiKey = envContent.match(/OPENAI_API_KEY=(.*)/)?.[1]?.trim() || "";
    res.json({ apiKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read API key' });
  }
});

// ----- Chat Endpoint -----
// Receives a user’s message, reads the latest API key, calls OpenAI’s Chat API, and returns the reply.
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, model = 'gpt-3.5-turbo' } = req.body;

  try {
    if (!existsSync(envFilePath)) {
      return res.status(400).json({ error: 'API key not set' });
    }
    const envContent = readFileSync(envFilePath, 'utf-8');
    const apiKey = envContent.match(/OPENAI_API_KEY=(.*)/)?.[1]?.trim();
    if (!apiKey) {
      return res.status(400).json({ error: 'API key not set' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ response: reply });
  } catch (error) {
    console.error('Error communicating with OpenAI API:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
