import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useSession } from '../lib/auth-client';
import type { Session } from '../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  setDemoMode: (demo: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = useSession();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoModeChecked, setDemoModeChecked] = useState(false);
  
  // Check for demo mode on mount
  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const demoMode = await AsyncStorage.getItem('demoMode');
        if (demoMode === 'true') {
          setIsDemoMode(true);
        }
        setDemoModeChecked(true);
      } catch (error) {
        setDemoModeChecked(true);
      }
    };
    checkDemoMode();
  }, []);
  
  const isAuthenticated = isDemoMode || !!session?.user;
  // Only show loading if we haven't checked demo mode yet. If demo mode is active, don't wait for session
  const isLoading = !demoModeChecked;
  

  const setDemoMode = async (demo: boolean) => {
    try {
      if (demo) {
        await AsyncStorage.setItem('demoMode', 'true');
        setIsDemoMode(true);
      } else {
        await AsyncStorage.removeItem('demoMode');
        setIsDemoMode(false);
      }
    } catch (error) {
      // Silently handle error - demo mode will fallback gracefully
    }
  };

  const value: AuthContextType = {
    session,
    isLoading,
    isAuthenticated,
    isDemoMode,
    setDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}