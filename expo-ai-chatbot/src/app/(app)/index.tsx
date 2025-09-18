import { generateUUID } from "@/lib/utils";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable,
  type TextInput,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetch } from "expo/fetch";
import { useChat } from "@ai-sdk/react";
import { ChatInterface } from "@/components/chat-interface";
import { ChatInput } from "@/components/ui/chat-input";
import { SuggestedActions } from "@/components/suggested-actions";
import type { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useStore } from "@/lib/globalStore";
import {
  MessageCirclePlusIcon,
  LogOut,
  History,
  LayoutDashboard,
} from "lucide-react-native";
import type { Message } from "@ai-sdk/react";
import Animated, { FadeIn } from "react-native-reanimated";
import { AuthGuard } from "@/components/auth-guard";
import { signOut } from "@/lib/auth-client";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

const HomePage = () => {
  const { clearImageUris, setBottomChatHeightHandler, chatId, setChatId } =
    useStore();
  const { setDemoMode } = useAuth();
  const inputRef = useRef<TextInput>(null);

  // Initialize chatId if not set
  useEffect(() => {
    if (!chatId) {
      setChatId({ id: generateUUID(), from: "newChat" });
    }
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    initialMessages: [],
    id: chatId?.id,
    api: `${process.env.EXPO_PUBLIC_API_URL}/api/chat-open?chatId=${chatId?.id}`,
    body: {
      modelId: "gpt-4o-mini",
    },
    onFinish: () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    },
    fetch: (url: string, options: RequestInit) => {
      return fetch(url, {
        ...options,
        signal: options.signal,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }).catch((error) => {
        throw error;
      });
    },
    onError(error) {
      // Handle chat errors silently
    },
  });

  const handleNewChat = useCallback(() => {
    // Reset messages first
    setMessages([]);
    clearImageUris();

    // Small delay to ensure state updates have propagated
    setTimeout(() => {
      const newChatId = generateUUID();
      setChatId({ id: newChatId, from: "newChat" });
      inputRef.current?.focus();
      setBottomChatHeightHandler(false);
    }, 100);
  }, [clearImageUris, setBottomChatHeightHandler, setMessages, setChatId]);

  const handleLogout = useCallback(async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await setDemoMode(false); // Clear demo mode on logout
          router.replace("/login");
        },
      },
    ]);
  }, [setDemoMode]);

  const handleTextChange = (text: string) => {
    handleInputChange({
      target: { value: text },
    } as any);
  };

  const { bottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<GHScrollView>(null);

  // Load existing chat messages when coming from history, reset for new chats
  useEffect(() => {
    if (chatId) {
      if (chatId.from === "history") {
        // Load existing chat messages
        const loadChatMessages = async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/api/chat?id=${chatId.id}`,
              {
                credentials: "include",
              },
            );

            if (response.ok) {
              const chatData = await response.json();
              const formattedMessages = chatData.messages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content:
                  typeof msg.content === "string"
                    ? msg.content
                    : JSON.stringify(msg.content),
                createdAt: new Date(msg.createdAt),
              }));
              setMessages(formattedMessages);
            }
          } catch (error) {
            // Failed to load chat messages - continue with empty chat
          }
        };

        loadChatMessages();
      } else {
        // New chat - reset messages
        setMessages([] as Message[]);
      }
    }
  }, [chatId, setMessages]);

  return (
    <AuthGuard>
      <Animated.View
        entering={FadeIn.duration(250)}
        className="flex-1 bg-white dark:bg-black"
        style={{ paddingBottom: bottom }}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: "AI Chat",
            headerLeft: () => (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => router.push("/dashboard")}>
                  <LayoutDashboard size={18} color="black" />
                </Pressable>
              </View>
            ),
            headerRight: () => (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => router.push("/history")}>
                  <History size={20} color="black" />
                </Pressable>
                <Pressable disabled={!messages.length} onPress={handleNewChat}>
                  <MessageCirclePlusIcon
                    size={20}
                    color={!messages.length ? "#eee" : "black"}
                  />
                </Pressable>
                <Pressable onPress={handleLogout}>
                  <LogOut size={20} color="black" />
                </Pressable>
              </View>
            ),
          }}
        />
        <ScrollView
          className="container relative mx-auto flex-1 bg-white dark:bg-black"
          ref={scrollViewRef}
        >
          <ChatInterface
            messages={messages}
            scrollViewRef={scrollViewRef}
            isLoading={isLoading}
          />
        </ScrollView>

        {messages.length === 0 && (
          <SuggestedActions hasInput={input.length > 0} append={append} />
        )}

        <ChatInput
          ref={inputRef}
          scrollViewRef={scrollViewRef}
          input={input}
          onChangeText={handleTextChange}
          focusOnMount={false}
          onSubmit={() => {
            setBottomChatHeightHandler(true);
            handleSubmit(undefined);
            clearImageUris();
          }}
        />
      </Animated.View>
    </AuthGuard>
  );
};

export default HomePage;
