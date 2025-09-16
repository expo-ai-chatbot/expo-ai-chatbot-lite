import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '@/components/auth/LoginScreen';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

// Mock Alert manually
const mockAlert = jest.fn();
(Alert.alert as jest.Mock) = mockAlert;

// Mock useAuth hook to have more control
const mockSignInWithGoogle = jest.fn();
const mockSignInWithDiscord = jest.fn();
const mockSignOut = jest.fn();
const mockCheckSession = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Wrapper component with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock auth state
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithDiscord: mockSignInWithDiscord,
      signOut: mockSignOut,
      checkSession: mockCheckSession,
      clearError: mockClearError,
    });
  });

  it('should complete full authentication flow', async () => {
    render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    // Should show welcome screen immediately since isLoading is false
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText(/Welcome To AI Chat/)).toBeTruthy();
    
    // Test Google authentication
    const googleButton = screen.getByText('G');
    fireEvent.press(googleButton);

    // Should call the Google sign-in function
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Test Discord authentication
    const discordButton = screen.getByText('D');
    fireEvent.press(discordButton);

    // Should call the Discord sign-in function
    expect(mockSignInWithDiscord).toHaveBeenCalledTimes(1);
  });

  it('should handle form navigation and submission', async () => {
    render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    // Should show welcome screen immediately
    expect(screen.getByText('Hello')).toBeTruthy();

    // Navigate to login form
    const loginButton = screen.getByText('Login');
    fireEvent.press(loginButton);

    // Should show login form
    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    // Fill out the form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    // Submit the form
    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);

    // Should show alert with form data
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Login',
        'Email: test@example.com\nPassword: password123'
      );
    });

    // Navigate back
    const backButton = screen.getByText('← Back');
    fireEvent.press(backButton);

    // Should be back to welcome screen
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeTruthy();
      expect(screen.getByText(/Welcome To AI Chat/)).toBeTruthy();
    });
  });

  it('should handle signup form', async () => {
    render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    // Should show welcome screen immediately
    expect(screen.getByText('Hello')).toBeTruthy();

    // Navigate to signup form
    const signUpButton = screen.getByText('Sign Up');
    fireEvent.press(signUpButton);

    // Should show signup form with name field
    await waitFor(() => {
      expect(screen.getAllByText('Sign Up')).toHaveLength(2); // Button and title
      expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    // Fill out signup form
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    // Submit signup form
    const submitButtons = screen.getAllByText('Sign Up');
    const submitButton = submitButtons[1]; // The second one is the submit button
    fireEvent.press(submitButton);

    // Should show alert with signup data
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Sign Up',
        'Name: John Doe\nEmail: john@example.com\nPassword: password123'
      );
    });
  });
});