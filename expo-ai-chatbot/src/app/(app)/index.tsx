import { generateUUID } from "@/lib/utils";
import { Redirect, Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, type TextInput, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetch as expoFetch } from "expo/fetch";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { LottieLoader } from "@/components/lottie-loader";
import { ChatInterface } from "@/components/chat-interface";
import { ChatInput } from "@/components/ui/chat-input";
import { SuggestedActions } from "@/components/suggested-actions";
import type { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useStore } from "@/lib/globalStore";
import { useAuth } from "@/services/auth/useAuth";
import { useChatFromHistory } from "@/hooks/useChatFromHistory";
import { MessageCirclePlusIcon, Menu } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { DrawerActions } from "@react-navigation/native";

const HomePage = () => {
  const { token } = useAuth();
  const navigation = useNavigation();

  // Use individual selectors to avoid re-rendering on unrelated store changes
  const clearImageUris = useStore((state) => state.clearImageUris);
  const setBottomChatHeightHandler = useStore((state) => state.setBottomChatHeightHandler);
  const chatId = useStore((state) => state.chatId);
  const setChatId = useStore((state) => state.setChatId);
  const setGlobalStoreMessages = useStore((state) => state.setGlobalStoreMessages);

  const inputRef = useRef<TextInput>(null);

  // Initialize chatId if not set
  useEffect(() => {
    if (!chatId) {
      setChatId({ id: generateUUID(), from: "newChat" });
    }
  }, []);

  // Load messages from history if coming from drawer
  const { initialMessages, loading } = useChatFromHistory({ chatId, token });

  const [input, setInput] = useState("");

  const {
    messages,
    status,
    setMessages,
    sendMessage,
  } = useChat({
    messages: [],
    id: chatId?.id,
    generateId: generateUUID,
    onFinish: () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    },
    onError(error) {
      console.log(">> error is", error.message);
    },
    transport: new DefaultChatTransport({
      api: `${process.env.EXPO_PUBLIC_API_URL}/api/chat`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      fetch: expoFetch,
      prepareSendMessagesRequest: ({ messages, id }) => {
        const lastMessage = messages.at(-1);
        return {
          body: {
            id: chatId?.id,
            message: lastMessage,
            selectedChatModel: "google/gemini-2.5-flash-lite",
            selectedVisibilityType: "public",
          },
        };
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Update messages when initialMessages changes (from history)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Sync messages to global store
  useEffect(() => {
    setGlobalStoreMessages(messages);
  }, [messages, setGlobalStoreMessages]);

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

  const handleTextChange = (text: string) => {
    setInput(text);
  };

  const handleFormSubmit = async (message: string) => {
    try {
      if (!message) {
        return;
      }

      setBottomChatHeightHandler(true);

      await sendMessage({
        text: message,
      });

      setInput("");
      clearImageUris();
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

  const { bottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<GHScrollView>(null);

  // Reset messages when chatId changes to a new chat
  useEffect(() => {
    if (chatId && chatId.from === "newChat") {
      setMessages([] as UIMessage[]);
    }
  }, [chatId, setMessages]);

  // Show loading if loading history
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LottieLoader />
      </View>
    );
  }

  // Redirect to signin if not authenticated
  if (!token) {
    return <Redirect href="/signin" />;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="flex-1 bg-white dark:bg-black"
      style={{ paddingBottom: bottom }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chat",
          headerLeft: () => (
            <Pressable
              className="android:mr-4"
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
                inputRef.current?.blur();
              }}
            >
              <Menu size={20} color="black" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable disabled={!messages?.length} onPress={handleNewChat}>
              <MessageCirclePlusIcon
                size={20}
                opacity={!messages?.length ? 0.5 : 1}
                color="black"
              />
            </Pressable>
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

      {messages?.length === 0 && (
        <SuggestedActions hasInput={input.length > 0} sendMessage={sendMessage} />
      )}

      <ChatInput
        ref={inputRef}
        scrollViewRef={scrollViewRef}
        input={input}
        onChangeText={handleTextChange}
        focusOnMount={false}
        onSubmit={handleFormSubmit}
      />
    </Animated.View>
  );
};

export default HomePage;
