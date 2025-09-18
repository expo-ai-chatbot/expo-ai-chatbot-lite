import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSession } from "@/lib/auth-client";
import { getChatsByUserId, fetchApi } from "@/lib/api-client";
import { MessageCircle, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useStore } from "@/lib/globalStore";
import { router } from "expo-router";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: any;
    createdAt: string;
  }>;
}

export function ChatHistory({ compact = false }: { compact?: boolean }) {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setChatId } = useStore();

  const loadChats = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      setLoading(true);
      
      // Use the updated API client that works with Better Auth sessions
      const chats = await getChatsByUserId();
      setChats(chats.chats || chats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  const handleChatPress = useCallback(
    (chat: Chat) => {
      setChatId({ id: chat.id, from: "history" });
      router.push("/");
    },
    [setChatId],
  );

  const handleDeleteChat = useCallback(async (chatId: string) => {
    try {
      await fetchApi(`/api/chat?id=${chatId}`, {
        method: "DELETE",
      });
      
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, []);

  const renderChatItem = useCallback(
    ({ item }: { item: Chat }) => {
      const lastMessage = item.messages[0];
      const lastMessageText = lastMessage
        ? typeof lastMessage.content === "string"
          ? lastMessage.content
          : "Message"
        : "No messages";

      return (
        <Pressable
          className="flex-row items-center border-b border-gray-200 p-4 dark:border-gray-700"
          onPress={() => handleChatPress(item)}
        >
          <MessageCircle size={20} color="gray" className="mr-3" />
          <View className="flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              className="mt-1 text-sm text-muted-foreground"
              numberOfLines={2}
            >
              {lastMessageText.slice(0, 100)}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
          <Pressable
            onPress={() => handleDeleteChat(item.id)}
            className="p-2"
            hitSlop={8}
          >
            <Trash2 size={16} color="red" />
          </Pressable>
        </Pressable>
      );
    },
    [handleChatPress, handleDeleteChat],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted-foreground">Loading chats...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-muted-foreground">
          Please sign in to view your chat history
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {chats.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <MessageCircle size={48} color="gray" />
          <Text className="mt-4 text-center text-muted-foreground">
            No chat history yet. Start a conversation to see your chats here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={compact ? chats.slice(0, 5) : chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            compact ? undefined : (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            )
          }
          scrollEnabled={!compact}
          nestedScrollEnabled={compact}
        />
      )}
    </View>
  );
}
