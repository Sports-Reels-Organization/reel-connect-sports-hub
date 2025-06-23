
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import InfoTooltip from '@/components/InfoTooltip';

const AuthForm = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [userType, setUserType] = useState<'team' | 'agent'>('team');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Store user type in localStorage to use after redirect
      localStorage.setItem('pending_user_type', userType);
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4 relative overflow-hidden">
      {/* Animated sports background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-bright-pink to-rosegold rounded-full animate-pulse blur-xl"></div>
        <div className="absolute top-32 right-20 w-32 h-32 bg-gradient-to-l from-rosegold to-bright-pink rounded-full animate-bounce blur-lg"></div>
        <div className="absolute bottom-20 left-32 w-36 h-36 bg-gradient-to-r from-bright-pink to-rosegold rounded-full animate-pulse blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-28 h-28 bg-gradient-to-l from-rosegold to-bright-pink rounded-full animate-bounce blur-lg"></div>
      </div>

      {/* Floating sports icons */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-1/4 text-6xl animate-bounce">⚽</div>
        <div className="absolute top-40 right-1/4 text-5xl animate-pulse">🏀</div>
        <div className="absolute bottom-32 left-1/3 text-4xl animate-bounce">🏐</div>
        <div className="absolute bottom-20 right-1/3 text-5xl animate-pulse">🎾</div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="relative">
            <img 
              src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" 
              alt="Sports Reels" 
              className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl"
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-bright-pink to-rosegold rounded-full opacity-20 blur-xl"></div>
          </div>
          <h1 className="text-5xl font-polysans font-bold text-white mb-4 bg-gradient-to-r from-bright-pink to-rosegold bg-clip-text text-transparent">
            Sports Reels
          </h1>
          <p className="text-rosegold font-poppins text-lg">
            The ultimate sports data platform for teams and agents
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-bright-pink to-rosegold mx-auto rounded-full mt-4"></div>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-rosegold/30 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="font-polysans text-2xl text-white">Welcome</CardTitle>
            <CardDescription className="font-poppins text-gray-300">
              Join Sports Reels to manage players, transfers, and scouting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="font-poppins font-medium text-white">
                  I am a:
                </label>
                <InfoTooltip content="Teams manage player profiles and transfers. Agents scout talent and negotiate deals." />
              </div>
              <Select value={userType} onValueChange={(value: 'team' | 'agent') => setUserType(value)}>
                <SelectTrigger className="font-poppins bg-white/5 border-rosegold/30 text-white focus:border-bright-pink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-rosegold/30">
                  <SelectItem value="team" className="text-white hover:bg-rosegold/20">Team/Club ⚽</SelectItem>
                  <SelectItem value="agent" className="text-white hover:bg-rosegold/20">Agent/Scout 🔍</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium py-6 text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400 font-poppins leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is secure and will be used to provide personalized sports management features.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom accent */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm font-poppins">
            <div className="w-2 h-2 bg-bright-pink rounded-full animate-pulse"></div>
            Join thousands of sports professionals
            <div className="w-2 h-2 bg-rosegold rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
