
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  userType: 'team' | 'agent';
  isProfileComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, userType: 'team' | 'agent') => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('sportsReelsUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        userType: 'team',
        isProfileComplete: false
      };
      
      setUser(mockUser);
      localStorage.setItem('sportsReelsUser', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '2',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        picture: 'https://via.placeholder.com/150',
        userType: 'team',
        isProfileComplete: false
      };
      
      setUser(mockUser);
      localStorage.setItem('sportsReelsUser', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, userType: 'team' | 'agent') => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        userType,
        isProfileComplete: false
      };
      
      setUser(mockUser);
      localStorage.setItem('sportsReelsUser', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sportsReelsUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithGoogle,
      logout,
      signup,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
