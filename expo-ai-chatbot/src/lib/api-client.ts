import AsyncStorage from "@react-native-async-storage/async-storage";

export async function fetchApi(
  endpoint: string,
  options: { token: string; chatId?: string; method?: string; body?: any },
) {
  const token = await AsyncStorage.getItem("session");

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}${endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`}`,
    {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
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

export async function getChatsByUserId({ token }: { token: string }) {
  try {
    console.log("getChatsByUserId called");
    const response = await fetchApi("history", {
      token,
    });
    console.log("getChatsByUserId response", response);
    return response;
  } catch (error) {
    console.error("Error fetching chats.", error);
    throw new Error("Failed to fetch chats");
  }
}

export async function getChatById({
  chatId,
  token,
}: {
  chatId: string;
  token: string;
}) {
  try {
    const response = await fetchApi("/api/chat", { chatId, token });
    return response;
  } catch (error) {
    console.error("Error fetching chat.", error);
    throw new Error("Failed to fetch chat");
  }
}
