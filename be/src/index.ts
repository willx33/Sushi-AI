import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Define the type for the OpenAI API response
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

// ----- Chat Endpoint -----
// Expects { message, model, apiKey } in the request body.
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, model = 'gpt-3.5-turbo', apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key not provided' });
  }

  console.log("Making request to OpenAI with model:", model);
  console.log("User message:", message);

  try {
    const openAiResponse = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("OpenAI API response data:", openAiResponse.data);
    const reply = openAiResponse.data.choices[0].message.content;
    res.json({ response: reply });
  } catch (error: any) {
    console.error('Error communicating with OpenAI API:', error.response?.data || error);
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit reached, please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to get response from OpenAI' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
