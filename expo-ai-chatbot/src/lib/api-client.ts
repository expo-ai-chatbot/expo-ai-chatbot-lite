import { authClient } from "@/lib/auth-client";

export async function fetchApi(
  endpoint: string,
  options: { chatId?: string; method?: string; body?: any } = {},
) {
  // Get the session from Better Auth client
  const session = await authClient.getSession();
  
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}${endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`}`,
    {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Better Auth will handle session cookies automatically with credentials: "include"
      },
      ...(options.body && { body: JSON.stringify(options.body) }),
      ...(options.chatId && !options.body && {
        body: JSON.stringify({ chatId: options.chatId }),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getChatsByUserId() {
  try {
    console.log("getChatsByUserId called");
    const response = await fetchApi("history");
    console.log("getChatsByUserId response", response);
    return response;
  } catch (error) {
    console.error("Error fetching chats.", error);
    throw new Error("Failed to fetch chats");
  }
}

export async function getChatById({ chatId }: { chatId: string }) {
  try {
    const response = await fetchApi("/api/chat", { chatId });
    return response;
  } catch (error) {
    console.error("Error fetching chat.", error);
    throw new Error("Failed to fetch chat");
  }
}
