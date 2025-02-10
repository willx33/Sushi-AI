import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

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

app.post('/api/chat', async (req: Request, res: Response) => {
  // Expect history to be an array of messages from the frontend
  const { history, model = 'gpt-3.5-turbo', apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key not provided' });
  }
  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Conversation history not provided' });
  }

  console.log("Making request to OpenAI with model:", model);
  console.log("Conversation history:", history);

  try {
    const openAiResponse = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: history,
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