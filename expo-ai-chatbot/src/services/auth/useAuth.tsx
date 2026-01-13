//use auth new version
import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { toast } from "@/components/sonner";
import { useBoolean } from "usehooks-ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "@/lib/globalStore";
import { DrawerActions, useNavigation } from "@react-navigation/native";

type AuthState = {
  isAuthenticated: boolean;
  token?: string;
  user?: { id: number; email: string };
  session?: { token: string; id: number };
};

type SignInProps = {
  email: string;
  password: string;
};

type SignUpProps = {
  email: string;
  password: string;
};

type AuthContextState = AuthState & {
  isLoading: boolean;
};

type AuthContextActions = {
  signIn: (props: SignInProps) => Promise<void>;
  signUp: (props: SignUpProps) => Promise<void>;
  signOut: () => void;
};

const AuthStateContext = createContext<AuthContextState | null>(null);
const AuthActionsContext = createContext<AuthContextActions | null>(null);

export function useAuth() {
  const state = useContext(AuthStateContext);
  const actions = useContext(AuthActionsContext);

  if (process.env.NODE_ENV !== "production") {
    if (!state || !actions) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
  }

  const redirectIfNotAuthenticated = useCallback(() => {
    // Navigation logic will be handled by components that use this hook
  }, [state.isAuthenticated]);

  const session = useMemo(() => {
    if (!state.token || !state.user?.id) return undefined;
    return {
      token: state.token,
      id: state?.user?.id,
    };
  }, [state.token, state.user?.id]);

  return { ...state, ...actions, redirectIfNotAuthenticated, session };
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [authState, setAuthState] = useAsyncState<AuthState>({
    isAuthenticated: false,
    token: undefined,
    user: undefined,
    session: undefined,
  });

  const { value: isLoading, setValue: setIsLoading } = useBoolean(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedAuthState = await AsyncStorage.getItem("authState");
        if (storedAuthState) {
          setAuthState(JSON.parse(storedAuthState));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const actions = useMemo(
    () => ({
      signIn: async ({ email, password }: SignInProps) => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Authentication failed");
          }

          await AsyncStorage.setItem("session", data.token);
          await setAuthState({
            isAuthenticated: true,
            token: data.token,
            user: data.user,
          });

          // Navigation will be handled by the component using this hook
        } catch (error) {
          toast.error(error.message || "Invalid credentials");
        } finally {
          setIsLoading(false);
        }
      },
      signUp: async ({ email, password }: SignUpProps) => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            if (data.error?.includes("exists")) {
              throw new Error("user_exists");
            }
            if (data.error?.includes("validation")) {
              throw new Error("invalid_data");
            }
            throw new Error("failed");
          }

          await AsyncStorage.setItem("session", data.token);
          await setAuthState({
            isAuthenticated: true,
            token: data.token,
            user: data.user,
          });

          toast.success("Account created successfully");
          // Navigation will be handled by the component using this hook
        } catch (error) {
          switch (error.message) {
            case "user_exists":
              toast.error("Account already exists");
              break;
            case "invalid_data":
              toast.error("Failed validating your submission!");
              break;
            default:
              toast.error("Failed to create account");
          }
          console.error("Signup error:", error);
        } finally {
          setIsLoading(false);
        }
      },
      signOut: async () => {
        const { setChatId } = useStore.getState();
        setChatId(null);
        setIsLoading(true);
        await AsyncStorage.removeItem("session");
        await setAuthState({
          session: undefined,
          isAuthenticated: false,
          token: undefined,
          user: undefined,
        });
        console.log("signout");
        // Navigation will be handled by the component using this hook
        setIsLoading(false);
      },
    }),
    [setAuthState, setIsLoading],
  );

  const state = useMemo(
    () => ({
      ...authState,
      isLoading,
    }),
    [authState, isLoading],
  );

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};
const useAsyncState = <T,>(
  initialValue: T,
): [T, (value: T) => Promise<void>] => {
  const [state, setState] = useState<T>(initialValue);

  const setAsyncState = async (value: T) => {
    setState(value);
    await AsyncStorage.setItem("authState", JSON.stringify(value));
  };

  return [state, setAsyncState];
};
