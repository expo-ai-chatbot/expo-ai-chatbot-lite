import React, { useCallback } from "react";
import { View, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { AuthGuard } from "@/components/auth-guard";
import { ChatHistory } from "@/components/chat-history";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LogOut,
  LayoutDashboard,
  MessageCirclePlus,
} from "lucide-react-native";
import { signOut } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/lib/globalStore";
import { generateUUID } from "@/lib/utils";

export default function HistoryScreen() {
  const { bottom } = useSafeAreaInsets();
  const { setDemoMode } = useAuth();
  const { setChatId } = useStore();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      await setDemoMode(false); // Clear demo mode on logout
      router.replace("/login");
    } catch (error) {
      // Handle logout error silently
    }
  }, [setDemoMode]);

  const handleNewChat = useCallback(() => {
    const newChatId = generateUUID();
    setChatId({ id: newChatId, from: "newChat" });
    router.push("/");
  }, [setChatId]);

  return (
    <AuthGuard>
      <View
        className="flex-1 bg-white dark:bg-black"
        style={{ paddingBottom: bottom }}
      >
        <Stack.Screen
          options={{
            title: "Chat History",
            headerShown: true,
            headerLeft: () => (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => router.push("/dashboard")}>
                  <LayoutDashboard size={18} color="black" />
                </Pressable>
              </View>
            ),
            headerRight: () => (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={handleNewChat}>
                  <MessageCirclePlus size={20} color="black" />
                </Pressable>
                <Pressable onPress={handleLogout}>
                  <LogOut size={20} color="black" />
                </Pressable>
              </View>
            ),
          }}
        />
        <ChatHistory />
      </View>
    </AuthGuard>
  );
}
