
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" 
            alt="Sports Reels" 
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-4xl font-polysans font-bold text-white mb-2">
            Sports Reels
          </h1>
          <p className="text-rosegold font-poppins">
            The ultimate sports data platform for teams and agents
          </p>
        </div>

        <Card className="bg-white border-rosegold">
          <CardHeader className="text-center">
            <CardTitle className="font-polysans text-2xl text-black">Welcome</CardTitle>
            <CardDescription className="font-poppins text-gray-600">
              Join Sports Reels to manage players, transfers, and scouting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="font-poppins font-medium text-black">
                  I am a:
                </label>
                <InfoTooltip content="Teams manage player profiles and transfers. Agents scout talent and negotiate deals." />
              </div>
              <Select value={userType} onValueChange={(value: 'team' | 'agent') => setUserType(value)}>
                <SelectTrigger className="font-poppins">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team/Club</SelectItem>
                  <SelectItem value="agent">Agent/Scout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins font-medium py-6 text-lg"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 font-poppins leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is secure and will be used to provide personalized sports management features.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
