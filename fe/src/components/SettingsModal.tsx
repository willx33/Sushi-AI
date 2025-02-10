import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  includeMemory: boolean;
  setIncludeMemory: (include: boolean) => void;
  clearChatHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  setApiKey,
  includeMemory,
  setIncludeMemory,
  clearChatHistory,
}) => {
  const [tempApiKey, setTempApiKey] = React.useState(apiKey);

  const handleSave = () => {
    setApiKey(tempApiKey);
    localStorage.setItem("apiKey", tempApiKey);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Settings
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 max-w-md w-full -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-lg">
          <Dialog.Title className="text-xl font-bold mb-4">Settings</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <Input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full"
              />
              <Button onClick={handleSave} className="mt-2">
                Save API Key
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Chat Memory</label>
              <button
                type="button"
                onClick={() => {
                  const newValue = !includeMemory;
                  setIncludeMemory(newValue);
                  localStorage.setItem("includeMemory", JSON.stringify(newValue));
                }}
                className={cn(
                  "w-10 h-6 flex items-center rounded-full p-1 transition-colors",
                  includeMemory ? "bg-primary" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full bg-white transition-transform",
                    includeMemory ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <div>
              <Button variant="destructive" onClick={clearChatHistory} className="w-full">
                Clear Chat History
              </Button>
            </div>
          </div>
          <Dialog.Close asChild>
            <Button variant="ghost" className="mt-6 w-full">
              Close
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
