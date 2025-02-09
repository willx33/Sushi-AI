import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ApiKeyInputProps {
  onSave: (apiKey: string) => void;
  initialKey?: string;
}

// Helper to mask the API key while still showing a hint of its value.
function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.substring(0, 4)}••••••${key.substring(key.length - 4)}`;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  onSave,
  initialKey,
}) => {
  const [apiKey, setApiKey] = React.useState(initialKey || "");
  const [isEditing, setIsEditing] = React.useState(!initialKey);

  const handleSave = async () => {
    if (apiKey.trim()) {
      try {
        // Use a relative URL so the Vite proxy (in vite.config.ts) handles it.
        const response = await fetch("/api/apikey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        });
        const result = await response.json();
        if (result.success) {
          onSave(apiKey);
          setIsEditing(false);
        } else {
          console.error("Failed to save API key");
        }
      } catch (error) {
        console.error("Error saving API key:", error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-50 border-b border-zinc-200">
      {isEditing ? (
        <>
          <Input
            type="password"
            value={apiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="max-w-md"
          />
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save
          </Button>
        </>
      ) : (
        <>
          <Input type="text" value={maskApiKey(apiKey)} disabled className="max-w-md" />
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </>
      )}
    </div>
  );
};
