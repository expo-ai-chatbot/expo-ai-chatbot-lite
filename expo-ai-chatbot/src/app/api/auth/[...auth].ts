import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;

// Default export required for Expo Router
export default function AuthHandler() {
  return null;
}
