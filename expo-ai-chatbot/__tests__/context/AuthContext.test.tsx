import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthContext', () => {
  const mockAuthValues = {
    user: null,
    session: null,
    isLoading: false,
    error: null,
    signInWithGoogle: jest.fn(),
    signInWithDiscord: jest.fn(),
    signOut: jest.fn(),
    checkSession: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthValues);
  });

  it('should provide auth context values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signInWithGoogle).toBe('function');
    expect(typeof result.current.signInWithDiscord).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.checkSession).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should throw error when useAuthContext is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuthContext());
    }).toThrow('useAuthContext must be used within an AuthProvider');

    console.error = originalError;
  });

  it('should pass through auth state changes', () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockSession = {
      id: 'session-1',
      userId: '1',
      expiresAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      ...mockAuthValues,
      user: mockUser,
      session: mockSession,
      isLoading: true,
      error: 'Some error',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toBe(mockUser);
    expect(result.current.session).toBe(mockSession);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Some error');
  });
});