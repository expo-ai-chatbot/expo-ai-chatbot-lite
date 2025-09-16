import { useState, useEffect } from 'react';
import { auth, type AuthState } from '@/lib/auth';
import * as WebBrowser from 'expo-web-browser';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const session = await auth.api.getSession();
      if (session) {
        setAuthState({
          user: session.user,
          session: session.session,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      // Silently handle session check errors - just set as not logged in
      console.log('Session check error:', error);
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        error: null, // Don't show technical errors to users
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await auth.api.signInSocial({
        provider: 'google',
      });

      if (result.data) {
        setAuthState({
          user: result.data.user,
          session: result.data.session,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.log('Google sign-in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Google sign-in is not available. Please try again later.',
      }));
    }
  };

  const signInWithDiscord = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await auth.api.signInSocial({
        provider: 'discord',
      });

      if (result.data) {
        setAuthState({
          user: result.data.user,
          session: result.data.session,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.log('Discord sign-in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Discord sign-in is not available. Please try again later.',
      }));
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await auth.api.signOut();
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    checkSession,
    clearError,
  };
}