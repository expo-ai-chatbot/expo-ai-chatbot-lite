import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { ChatHistory } from '@/components/chat-history';
import { MessageCirclePlus, User, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { signOut } from '@/lib/auth-client';
import { useStore } from '@/lib/globalStore';
import { generateUUID } from '@/lib/utils';

export default function DashboardScreen() {
  const { session, setDemoMode, isDemoMode } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const { setChatId } = useStore();
  const handleNewChat = useCallback(() => {
    const newChatId = generateUUID();
    setChatId({ id: newChatId, from: 'newChat' });
    router.push('/');
  }, [setChatId]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      await setDemoMode(false); // Clear demo mode on logout
      router.replace('/login');
    } catch (error) {
      // Handle logout error silently
    }
  }, [setDemoMode]);

  const getUserDisplayName = () => {
    if (isDemoMode) return 'Demo User';
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email;
    return 'User';
  };


  return (
    <AuthGuard>
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-1 bg-white dark:bg-black"
        style={{ paddingBottom: bottom }}
      >
        <Stack.Screen
          options={{
            title: 'Dashboard',
            headerShown: true,
            headerRight: () => (
              <Pressable onPress={handleLogout}>
                <LogOut size={20} color="black" />
              </Pressable>
            ),
          }}
        />

        <ScrollView className="flex-1">
          {/* Welcome Section */}
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                <User size={24} color="white" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-foreground">
                  Welcome back!
                </Text>
                <Text className="text-lg text-muted-foreground">
                  {getUserDisplayName()}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="mb-6">
              <Pressable
                onPress={handleNewChat}
                className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center"
              >
                <MessageCirclePlus size={24} color="white" className="mr-3" />
                <Text className="text-white text-lg font-semibold">
                  Start New Chat
                </Text>
              </Pressable>
            </View>

            {/* Chat History Section */}
            <View className="mb-4">
              <Text className="text-xl font-semibold text-foreground mb-4">
                Recent Conversations
              </Text>
              
              <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
                <ChatHistory compact={true} />
                <View className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Pressable
                    onPress={() => router.push('/history')}
                    className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 items-center"
                  >
                    <Text className="text-blue-600 dark:text-blue-300 font-medium">
                      View All Conversations
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </AuthGuard>
  );
}