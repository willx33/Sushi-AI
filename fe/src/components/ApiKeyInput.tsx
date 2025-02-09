// src/components/ApiKeyInput.tsx
import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface ApiKeyInputProps {
  onSave: (apiKey: string) => void;
  initialKey?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  onSave,
  initialKey,
}) => {
  const [apiKey, setApiKey] = useState(initialKey || '');
  const [isEditing, setIsEditing] = useState(!initialKey);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-50 border-b border-zinc-200">
      {isEditing ? (
        <>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="max-w-md"
          />
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save
          </Button>
        </>
      ) : (
        <>
          <Input
            type="password"
            value="••••••••"
            disabled
            className="max-w-md"
          />
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </>
      )}
    </div>
  );
};