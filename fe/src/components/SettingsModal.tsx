import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProfile } from "@/db/profile";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SettingsModalProps {
  includeMemory: boolean;
  setIncludeMemory: (include: boolean) => void;
  clearChatHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  includeMemory,
  setIncludeMemory,
  clearChatHistory,
}) => {
  const [open, setOpen] = React.useState(false);
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    setOpen(false);
    try {
      console.log("Initiating sign out");
      // Let the AuthContext handle the redirect
      await signOut();
      // The redirect should now be handled in the AuthContext
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback redirect in case AuthContext fails
      window.location.href = '/login';
    }
  };
  
  // API Key states
  const [openaiApiKey, setOpenaiApiKey] = React.useState(profile?.openaiApiKey || "");
  const [anthropicApiKey, setAnthropicApiKey] = React.useState(profile?.anthropicApiKey || "");
  const [googleApiKey, setGoogleApiKey] = React.useState(profile?.googleApiKey || "");
  const [mistralApiKey, setMistralApiKey] = React.useState(profile?.mistralApiKey || "");
  
  // Theme state
  const [theme, setTheme] = React.useState(profile?.theme || "system");
  
  // Language state
  const [preferredLanguage, setPreferredLanguage] = React.useState(profile?.preferredLanguage || "en");
  
  // Update states when profile changes
  React.useEffect(() => {
    if (profile) {
      setOpenaiApiKey(profile.openaiApiKey || "");
      setAnthropicApiKey(profile.anthropicApiKey || "");
      setGoogleApiKey(profile.googleApiKey || "");
      setMistralApiKey(profile.mistralApiKey || "");
      setTheme(profile.theme || "system");
      setPreferredLanguage(profile.preferredLanguage || "en");
    }
  }, [profile]);

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Save settings to localStorage regardless of mode (for persistence in dev mode)
      localStorage.setItem("openaiApiKey", openaiApiKey || '');
      localStorage.setItem("anthropicApiKey", anthropicApiKey || '');
      localStorage.setItem("googleApiKey", googleApiKey || '');
      localStorage.setItem("mistralApiKey", mistralApiKey || '');
      localStorage.setItem("theme", theme);
      localStorage.setItem("preferredLanguage", preferredLanguage);
      localStorage.setItem("includeMemory", JSON.stringify(includeMemory));
      
      // Check if we're in dev mode
      const isDevMode = localStorage.getItem('devMode') === 'true';
      
      if (isDevMode) {
        // In dev mode, just use localStorage - no need for database
        toast({
          title: "Success",
          description: "Settings saved to local storage (dev mode)",
        });
        // Force reload to apply new settings
        window.location.reload();
        return;
      }
      
      // Regular mode - update profile in database
      const success = await updateProfile(user.id, {
        openaiApiKey,
        anthropicApiKey,
        googleApiKey,
        mistralApiKey,
        theme: theme as 'light' | 'dark' | 'system',
        preferredLanguage,
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Settings updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update settings in database, but saved locally",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Warning",
        description: "Saved settings locally but database update failed",
        variant: "destructive",
      });
    }
  };

  // Apply theme change immediately
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    
    // Immediately apply theme change to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Settings
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 max-w-md w-full -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-lg"
          )}
        >
          <Dialog.Title className="text-xl font-bold mb-4">Settings</Dialog.Title>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* API Key Section */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-lg font-semibold">API Settings</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">OpenAI API Key</label>
                <Input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Anthropic API Key</label>
                <Input
                  type="password"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Google AI API Key</label>
                <Input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Mistral API Key</label>
                <Input
                  type="password"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                  placeholder="..."
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Chat Settings Section */}
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-lg font-semibold">Chat Settings</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Chat Memory</span>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !includeMemory;
                    setIncludeMemory(newValue);
                    localStorage.setItem("includeMemory", JSON.stringify(newValue));
                  }}
                  className={cn(
                    "w-10 h-6 flex items-center rounded-full p-1 transition-colors",
                    includeMemory
                      ? "bg-primary dark:bg-gray-700"
                      : "bg-gray-300 dark:bg-gray-600"
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
            </div>
            
            {/* Appearance Settings Section */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-lg font-semibold">Appearance</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Theme</label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Language</label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Account Actions Section */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-lg font-semibold">Account</h3>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    console.log("Clear chat history button clicked");
                    clearChatHistory();
                    // Close the dialog after clearing
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  Clear Chat History
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> 
                  Sign Out
                </Button>
              </div>
            </div>
            
            {/* Bottom Buttons */}
            <div className="flex flex-wrap justify-end gap-2">
              <Button 
                variant="default" 
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
              
              <Dialog.Close asChild>
                <Button variant="ghost">Close</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsModal;