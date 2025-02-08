"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch the saved (masked) API key from the backend
    axios
      .get("http://localhost:5000/api/key")
      .then((res) => {
        if (res.data.apiKey) {
          setSavedKey(res.data.apiKey);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    try {
      await axios.post("http://localhost:5000/api/key", { apiKey });
      // Show masked version: first 4, then stars, then last 4 characters
      setSavedKey(apiKey.slice(0, 4) + "*".repeat(apiKey.length - 8) + apiKey.slice(-4));
      setApiKey("");
      setMessage("API key saved!");
    } catch (error) {
      console.error(error);
      setMessage("Error saving API key.");
    }
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Enter OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleSave}>Save Key</Button>
      </div>
      {savedKey && (
        <p className="mt-2 text-sm text-muted-foreground">
          Saved API Key: {savedKey}
        </p>
      )}
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
    </div>
  );
}
