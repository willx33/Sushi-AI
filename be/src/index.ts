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
const envFilePath = join(__dirname, "../.env");

// Define the type for OpenAI API response
type OpenAIResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
};

// ----- API Key Endpoints -----

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

    const response = await axios.post<OpenAIResponse>(
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