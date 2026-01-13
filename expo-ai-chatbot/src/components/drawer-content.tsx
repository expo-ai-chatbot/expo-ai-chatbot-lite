import { View, Text, Pressable, ScrollView } from "react-native";
import { useAuth } from "@/services/auth/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { getChatsByUserId } from "@/lib/api-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/lib/globalStore";

type Chat = {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
};

const groupChatsByDate = (chats: Chat[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return chats.reduce(
    (groups: Record<string, Chat[]>, chat) => {
      const chatDate = new Date(chat.createdAt);
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate.getTime() === today.getTime()) {
        groups.today = [...(groups.today || []), chat];
      } else if (chatDate.getTime() === yesterday.getTime()) {
        groups.yesterday = [...(groups.yesterday || []), chat];
      } else if (chatDate >= lastWeek) {
        groups.lastWeek = [...(groups.lastWeek || []), chat];
      } else if (chatDate >= lastMonth) {
        groups.lastMonth = [...(groups.lastMonth || []), chat];
      } else {
        groups.older = [...(groups.older || []), chat];
      }
      return groups;
    },
    {} as Record<string, Chat[]>,
  );
};

export function DrawerContent() {
  const { signOut, token, isLoading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const router = useRouter();
  const { chatId, setChatId } = useStore();

  const fetchChats = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { chats: data } = await getChatsByUserId({ token });

      if (Array.isArray(data)) {
        setChats(data);
        if (data.length > 0) {
          setRetryAttempt(0);
        } else {
          setRetryAttempt((prev) => prev + 1);
        }
      } else {
        setRetryAttempt((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      setRetryAttempt((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount or when auth changes
  useEffect(() => {
    fetchChats();
  }, [token, authLoading, chatId]);

  const groupedChats = groupChatsByDate(chats);
  const { top, bottom } = useSafeAreaInsets();

  if (authLoading) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: top, paddingBottom: bottom }}
      >
        <Text className="mt-4 text-center text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: top, paddingBottom: bottom }}
      >
        <Text className="mt-4 text-center text-muted-foreground">
          Please login to see your chat history
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: top,
        paddingBottom: bottom,
      }}
    >
      <ScrollView className="flex-1 px-2">
        {isLoading && chats.length === 0 ? (
          <Text className="mt-4 text-center text-muted-foreground">
            Loading chats...
          </Text>
        ) : chats.length === 0 ? (
          <Text className="mt-4 text-center text-muted-foreground">
            No chats yet
          </Text>
        ) : (
          (Object.entries(groupedChats) as [string, Chat[]][]).map(
            ([period, periodChats]) => (
              <View key={period} className="mt-4">
                <Text className="mb-2 px-2 py-1 text-xs text-foreground">
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
                {periodChats.map((chat) => (
                  <Pressable
                    key={chat.id}
                    onPress={() => {
                      setChatId({ id: chat.id, from: "history" });
                      router.back();
                    }}
                    className="flex-row items-center rounded-lg px-2 py-2 hover:bg-muted"
                  >
                    <Text
                      className="flex-1 text-sm text-foreground"
                      numberOfLines={1}
                    >
                      {chat.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ),
          )
        )}
      </ScrollView>

      <Pressable
        onPress={signOut}
        className="m-4 rounded-lg bg-destructive p-2"
      >
        <Text className="text-center font-medium text-destructive-foreground">
          Logout
        </Text>
      </Pressable>
    </View>
  );
}
