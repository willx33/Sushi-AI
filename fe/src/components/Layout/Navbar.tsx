// fe/src/components/Layout/Navbar.tsx
import { Button } from '@/components/ui/button';
import SettingsModal from '@/components/SettingsModal';
import { useAuth } from '@/context/AuthContext';
import { User } from 'lucide-react';

interface NavbarProps {
  includeMemory: boolean;
  setIncludeMemory: (include: boolean) => void;
  clearChatHistory: () => void;
  showWelcomeScreen: () => void;
}

export function Navbar({ includeMemory, setIncludeMemory, clearChatHistory, showWelcomeScreen }: NavbarProps) {
  const { user } = useAuth();
  const isDevelopmentMode = localStorage.getItem('devMode') === 'true';

  return (
    <nav className="flex items-center justify-between border-b p-3 bg-card">
      <div className="flex items-center space-x-2">
        <button 
          onClick={showWelcomeScreen}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img src="/sush.png" alt="Sushi AI" className="w-7 h-7" />
          <span className="font-semibold">Sushi AI</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* User Status Badge */}
        <div className={`flex items-center px-2 py-1 rounded text-xs ${isDevelopmentMode ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          <User className="h-3 w-3 mr-1" />
          {isDevelopmentMode ? (
            <span>DEV MODE</span>
          ) : (
            <span>{user?.email || 'Signed In'}</span>
          )}
        </div>
        
        <div className="w-28">
          <SettingsModal 
            includeMemory={includeMemory}
            setIncludeMemory={setIncludeMemory}
            clearChatHistory={clearChatHistory}
          />
        </div>
      </div>
    </nav>
  );
}