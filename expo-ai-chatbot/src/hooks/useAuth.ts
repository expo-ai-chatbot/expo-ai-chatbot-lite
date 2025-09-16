import { useState, useEffect } from 'react';
import { type AuthState } from '@/lib/auth';
import { Alert } from 'react-native';

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
      
      // For development, we'll just check if we already have a user in state
      // In production, this would make a real API call
      if (authState.user) {
        // Session is already valid
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Simulate checking for existing session
      setTimeout(() => {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
      }, 500);
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
      
      // Mock authentication for development
      Alert.alert(
        'Google Sign In',
        'For development, this will simulate Google authentication. In production, this would use proper OAuth.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
          },
          {
            text: 'Sign In (Mock)',
            onPress: () => {
              // Simulate successful authentication
              setTimeout(() => {
                setAuthState({
                  user: {
                    id: 'mock-google-user',
                    name: 'John Doe (Google)',
                    email: 'john@gmail.com',
                    image: 'https://ui-avatars.com/api/?name=John+Doe&background=4285f4&color=fff&size=200'
                  },
                  session: {
                    id: 'mock-session',
                    userId: 'mock-google-user',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  },
                  isLoading: false,
                  error: null,
                });
              }, 1000);
            }
          }
        ]
      );
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
      
      // Mock authentication for development
      Alert.alert(
        'Discord Sign In',
        'For development, this will simulate Discord authentication. In production, this would use proper OAuth.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
          },
          {
            text: 'Sign In (Mock)',
            onPress: () => {
              // Simulate successful authentication
              setTimeout(() => {
                setAuthState({
                  user: {
                    id: 'mock-discord-user',
                    name: 'Jane Smith (Discord)',
                    email: 'jane@discord.com',
                    image: 'https://ui-avatars.com/api/?name=Jane+Smith&background=5865f2&color=fff&size=200'
                  },
                  session: {
                    id: 'mock-session',
                    userId: 'mock-discord-user',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  },
                  isLoading: false,
                  error: null,
                });
              }, 1000);
            }
          }
        ]
      );
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
    // For mock auth, simply clear the state
    setAuthState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
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
