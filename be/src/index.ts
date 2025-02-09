// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// API key management
app.post('/api/apikey', (req, res) => {
  const { apiKey } = req.body;
  try {
    writeFileSync('.env', `OPENAI_API_KEY=${apiKey}\n`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

app.get('/api/apikey', (req, res) => {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    const apiKey = envContent.match(/OPENAI_API_KEY=(.*)/)?.[1] || '';
    res.json({ apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read API key' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});