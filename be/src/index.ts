import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const app = express();
const PORT = process.env.PORT || 5000;
const ENV_PATH = path.join(__dirname, ".env");

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// If an .env file exists, load it
if (fs.existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
}

// GET /api/key – returns the saved API key (masked)
app.get("/api/key", (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ apiKey: null });
  }
  // Mask the key: show first 4 and last 4 characters
  const masked = apiKey.slice(0, 4) + "*".repeat(apiKey.length - 8) + apiKey.slice(-4);
  res.json({ apiKey: masked });
});

// POST /api/key – saves the API key to .env (creates file if needed)
app.post("/api/key", (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: "apiKey is required" });
  }
  const envContent = `OPENAI_API_KEY=${apiKey}\n`;
  fs.writeFileSync(ENV_PATH, envContent, { encoding: "utf8" });
  res.json({ message: "API key saved successfully" });
});

// POST /api/chat – dummy endpoint to echo a reply (replace with real OpenAI calls later)
app.post("/api/chat", (req, res) => {
  const { messages } = req.body;
  // Here you would normally forward the messages to the OpenAI API.
  res.json({ reply: "This is a dummy reply.", messages });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
