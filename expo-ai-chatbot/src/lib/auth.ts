import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [expo()],
  socialProviders: {
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/callback/google`,
    },
    discord: {
      clientId: process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      redirectURI: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/callback/discord`,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;

// Re-export auth types for convenience
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

// Default avatar URL generator
export const getAvatarUrl = (user: User | null): string => {
  if (user?.image) {
    return user.image;
  }
  
  if (user?.email) {
    // Generate a simple avatar based on initials
    const initials = user.name ? 
      user.name.split(' ').map(n => n[0]).join('').toUpperCase() :
      user.email[0].toUpperCase();
    
    // Use a placeholder service or generate a simple colored avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=667eea&color=fff&size=200`;
  }
  
  return 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200';
};