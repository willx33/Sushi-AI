// fe/src/components/Layout/Navbar.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, ChevronLeft } from 'lucide-react';

export function Navbar() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="flex items-center justify-between border-b p-3 bg-card">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/sush.png" alt="Sushi AI" className="w-7 h-7" />
          <span className="font-semibold">Sushi AI</span>
        </Link>
      </div>
      <div className="flex items-center space-x-2">
        <Link to="/settings">
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}