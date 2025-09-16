import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import LoginScreen from "@/components/auth/LoginScreen";
import { useAuth } from "@/hooks/useAuth";

// Mock the useAuth hook
jest.mock("@/hooks/useAuth");

// Mock Alert manually
const mockAlert = jest.fn();
(Alert.alert as jest.Mock) = mockAlert;

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("LoginScreen", () => {
  const mockSignInWithGoogle = jest.fn();
  const mockSignInWithDiscord = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithDiscord: mockSignInWithDiscord,
      signOut: jest.fn(),
      checkSession: jest.fn(),
      clearError: mockClearError,
    });
  });

  it("should render welcome screen by default", () => {
    render(<LoginScreen />);

    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText(/Welcome To AI Chat/)).toBeTruthy();
    expect(screen.getByText("Login")).toBeTruthy();
    expect(screen.getByText("Sign Up")).toBeTruthy();
    expect(screen.getByText("Or sign in with")).toBeTruthy();
  });

  it("should show loading screen when isLoading is true", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithDiscord: mockSignInWithDiscord,
      signOut: jest.fn(),
      checkSession: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginScreen />);

    expect(screen.getByText("Signing you in...")).toBeTruthy();
    expect(screen.getByTestId("activity-indicator")).toBeTruthy();
  });

  it("should show login form when Login button is pressed", () => {
    render(<LoginScreen />);

    const loginButton = screen.getByText("Login");
    fireEvent.press(loginButton);

    expect(screen.getByText("← Back")).toBeTruthy();
    expect(screen.getByText("Login")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();
    expect(screen.getByText("Forgot password?")).toBeTruthy();
  });

  it("should show signup form when Sign Up button is pressed", () => {
    render(<LoginScreen />);

    const signUpButton = screen.getByText("Sign Up");
    fireEvent.press(signUpButton);

    expect(screen.getByText("← Back")).toBeTruthy();
    expect(screen.getAllByText("Sign Up")).toHaveLength(2); // Button and title
    expect(screen.getByPlaceholderText("Enter your name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();
  });

  it("should call signInWithGoogle when Google button is pressed", async () => {
    render(<LoginScreen />);

    const googleButton = screen.getByText("G");
    fireEvent.press(googleButton);

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("should call signInWithDiscord when Discord button is pressed", async () => {
    render(<LoginScreen />);

    const discordButton = screen.getByText("D");
    fireEvent.press(discordButton);

    expect(mockSignInWithDiscord).toHaveBeenCalledTimes(1);
  });

  it("should display error message when error exists", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: "Authentication failed",
      signInWithGoogle: mockSignInWithGoogle,
      signInWithDiscord: mockSignInWithDiscord,
      signOut: jest.fn(),
      checkSession: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginScreen />);

    expect(screen.getByText("Authentication failed")).toBeTruthy();
    expect(screen.getByText("Tap to dismiss")).toBeTruthy();
  });

  it("should clear error when error container is pressed", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: "Authentication failed",
      signInWithGoogle: mockSignInWithGoogle,
      signInWithDiscord: mockSignInWithDiscord,
      signOut: jest.fn(),
      checkSession: jest.fn(),
      clearError: mockClearError,
    });

    render(<LoginScreen />);

    const errorContainer = screen.getByText("Authentication failed").parent;
    fireEvent.press(errorContainer);

    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it("should go back to welcome screen when back button is pressed", () => {
    render(<LoginScreen />);

    // Navigate to login form
    const loginButton = screen.getByText("Login");
    fireEvent.press(loginButton);

    // Press back button
    const backButton = screen.getByText("← Back");
    fireEvent.press(backButton);

    // Should be back to welcome screen
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText(/Welcome To AI Chat/)).toBeTruthy();
  });

  it("should handle form submission", () => {
    render(<LoginScreen />);

    // Navigate to login form
    const loginButton = screen.getByText("Login");
    fireEvent.press(loginButton);

    // Fill form
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    // Submit form
    const signInButton = screen.getByText("Sign In");
    fireEvent.press(signInButton);

    expect(mockAlert).toHaveBeenCalledWith(
      "Login",
      "Email: test@example.com\nPassword: password123",
    );
  });
});
