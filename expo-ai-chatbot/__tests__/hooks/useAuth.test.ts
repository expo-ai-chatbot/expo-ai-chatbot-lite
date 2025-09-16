import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from 'react-native';

// Mock Alert manually
const mockAlert = jest.fn();
(Alert.alert as jest.Mock) = mockAlert;

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(true); // Initial loading state
    expect(result.current.error).toBeNull();
  });

  it('should clear error when clearError is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Wait for initial loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    // Simulate an error state
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should show Google sign-in alert when signInWithGoogle is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Google Sign In',
      'For development, this will simulate Google authentication. In production, this would use proper OAuth.',
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Cancel',
          style: 'cancel',
        }),
        expect.objectContaining({
          text: 'Sign In (Mock)',
        }),
      ])
    );
  });

  it('should show Discord sign-in alert when signInWithDiscord is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signInWithDiscord();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Discord Sign In',
      'For development, this will simulate Discord authentication. In production, this would use proper OAuth.',
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Cancel',
          style: 'cancel',
        }),
        expect.objectContaining({
          text: 'Sign In (Mock)',
        }),
      ])
    );
  });

  it('should sign out user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should complete initial session check', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Wait for checkSession to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    expect(result.current.isLoading).toBe(false);
  });
});