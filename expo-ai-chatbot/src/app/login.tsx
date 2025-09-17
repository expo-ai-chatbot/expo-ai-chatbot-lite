import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signIn } from "@/lib/auth-client";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { top, bottom } = useSafeAreaInsets();
  const { setDemoMode } = useAuth();

  const handleDiscordLogin = async () => {
    try {
      setIsDiscordLoading(true);
      // Check if Discord provider is configured
      if (!process.env.EXPO_PUBLIC_DISCORD_AVAILABLE) {
        Alert.alert(
          "Discord Login Unavailable",
          "Discord login is not configured yet. Please set up Discord OAuth credentials.",
        );
        return;
      }
      await signIn.social({
        provider: 'discord',
      });
      router.replace('/(app)/history');
    } catch (error) {
      Alert.alert(
        "Login Error",
        "Discord login is not available. Please configure OAuth credentials or use another method.",
      );
    } finally {
      setIsDiscordLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      // Check if Google provider is configured
      if (!process.env.EXPO_PUBLIC_GOOGLE_AVAILABLE) {
        Alert.alert(
          "Google Login Unavailable",
          "Google login is not configured yet. Please set up Google OAuth credentials.",
        );
        return;
      }
      await signIn.social({
        provider: 'google',
      });
      router.replace('/(app)/history');
    } catch (error) {
      Alert.alert(
        "Login Error",
        "Google login is not available. Please configure OAuth credentials or use another method.",
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Guest/demo login function
  const handleDemoLogin = async () => {
    // Navigate to app without authentication for demo purposes
    Alert.alert(
      "Demo Access",
      "This will give you demo access to explore the app. Social login requires OAuth setup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue as Demo",
          onPress: async () => {
            try {
              await setDemoMode(true);
              router.replace('/(app)/history');
            } catch (error) {
              Alert.alert('Error', 'Failed to enter demo mode. Please try again.');
            }
          }
        },
      ],
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-1 bg-white px-6 dark:bg-black"
      style={{ paddingTop: top + 20, paddingBottom: bottom + 20 }}
    >
      <View className="flex-1 justify-center space-y-8">
        {/* Header */}
        <View className="items-center space-y-4">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </Text>
          <Text className="text-center text-lg text-gray-600 dark:text-gray-400">
            Sign in to continue using the AI chatbot
          </Text>
        </View>

        {/* OAuth Buttons */}
        <View className="space-y-4">
          {/* Discord Button */}
          <Pressable
            onPress={handleDiscordLogin}
            disabled={isDiscordLoading || isGoogleLoading}
            className={`flex-row items-center justify-center space-x-3 rounded-xl bg-[#5865F2] px-6 py-4 ${
              isDiscordLoading || isGoogleLoading ? "opacity-50" : ""
            }`}
          >
            {isDiscordLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-lg font-semibold text-white">📱</Text>
            )}
            <Text className="text-lg font-semibold text-white">
              Continue with Discord
            </Text>
          </Pressable>

          {/* Google Button */}
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || isDiscordLoading}
            className={`flex-row items-center justify-center space-x-3 rounded-xl border border-gray-300 bg-white px-6 py-4 dark:border-gray-600 dark:bg-gray-800 ${
              isGoogleLoading || isDiscordLoading ? "opacity-50" : ""
            }`}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#4285F4" size="small" />
            ) : (
              <Text className="text-lg">🔍</Text>
            )}
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Continue with Google
            </Text>
          </Pressable>

          {/* Demo Button */}
          <Pressable
            onPress={handleDemoLogin}
            className="mt-4 flex-row items-center justify-center space-x-3 rounded-xl bg-gray-100 px-6 py-4 dark:bg-gray-700"
          >
            <Text className="text-lg">🎭</Text>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Continue as Demo
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
