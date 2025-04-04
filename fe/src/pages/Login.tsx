// fe/src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('devMode') === 'true');
  
  const { user, signIn, signUp, authError, setAuthError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Toggle development mode with enhanced functionality
  const toggleDevMode = () => {
    const newDevMode = !devMode;
    setDevMode(newDevMode);
    localStorage.setItem('devMode', String(newDevMode));
    
    if (newDevMode) {
      // Create a persistent user ID for dev mode that will stay consistent
      // This ensures chat history remains accessible across sessions
      const existingDevUserId = localStorage.getItem('devUserId');
      if (!existingDevUserId) {
        localStorage.setItem('devUserId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      }
      
      toast({ 
        title: 'Dev Mode Enabled', 
        description: 'Using persistent dev account with saved settings' 
      });
      // Reload to apply the dev mode
      window.location.href = '/';
    } else {
      toast({ 
        title: 'Dev Mode Disabled', 
        description: 'App will use normal authentication' 
      });
    }
  };
  
  // Clear any previous auth errors
  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [authError, setAuthError]);
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Direct authentication process
      if (isSignUp) {
        console.log('Attempting signup with:', email);
        const { error, user } = await signUp(email, password);
        
        if (error) {
          console.error('Signup error:', error);
          
          // Handle signup errors with clear messages
          let errorMessage = error.message;
          if (error.message.includes('User already registered')) {
            errorMessage = 'This email is already registered. Please sign in instead.';
          } else if (error.message.includes('invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (error.message.includes('password')) {
            errorMessage = 'Password must be at least 6 characters.';
          }
          
          setError(errorMessage);
          toast({
            title: "Signup failed",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          const message = "Account created! You can now sign in.";
          setSuccess(message);
          toast({
            title: "Success",
            description: message,
          });
          // Switch to sign in mode after successful signup
          setIsSignUp(false);
        }
      } else {
        console.log('Attempting login with:', email);
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error('Login error:', error);
          
          // Handle login errors with clear messages
          let errorMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
          }
          
          setError(errorMessage);
          toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Logged in successfully",
          });
          navigate('/');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Auth error:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/sush.png" alt="Sushi AI" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl text-center">{isSignUp ? 'Create an account' : 'Welcome back'}</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? 'Enter your details to create an account' : 'Enter your credentials to log in'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Success Message */}
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-300 text-green-700">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                {isSignUp && "Password must be at least 6 characters"}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded text-xs border border-blue-200 dark:border-blue-800">
              <p className="font-bold text-sm mb-1">👋 Welcome to Sushi AI!</p>
              <p className="mb-1">Create an account to get started or sign in with your existing account.</p>
              <p className="mb-1">Your chat history and settings will be saved to your account.</p>
            </div>
            
            {/* Dev Mode Info */}
            <div className="p-2 mt-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold">🧪 Developer Mode Available</p>
              <p>For testing, you can use: <br />
                Email: <span className="font-mono">dev@example.com</span><br />
                Password: <span className="font-mono">devpassword</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
            </Button>
            
            
            {/* Dev mode toggle (less prominent) */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDevMode();
                }}
              >
                {devMode ? 'Disable Dev Mode' : 'Developer Options'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}