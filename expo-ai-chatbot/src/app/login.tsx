import React, { useState, useEffect } from "react";
import { View, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signIn } from "@/lib/auth-client";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "@/contexts/auth-context";
// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import H1 from "@/components/ui/h1";

export default function LoginScreen() {
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { top, bottom } = useSafeAreaInsets();
  const { setDemoMode, isAuthenticated, session } = useAuth();

  // Monitor authentication state and redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User authenticated, navigating to history...");
      // Reset loading states and navigate
      setIsDiscordLoading(false);
      setIsGoogleLoading(false);
      router.replace("/(app)/history");
    }
  }, [isAuthenticated]);

  // Add timeout to reset loading states if login takes too long
  useEffect(() => {
    let discordTimeout: NodeJS.Timeout | null = null;
    let googleTimeout: NodeJS.Timeout | null = null;

    if (isDiscordLoading) {
      discordTimeout = setTimeout(() => {
        console.log("Discord login timeout, resetting loading state");
        setIsDiscordLoading(false);
      }, 30000); // 30 seconds timeout
    }

    if (isGoogleLoading) {
      googleTimeout = setTimeout(() => {
        console.log("Google login timeout, resetting loading state");
        setIsGoogleLoading(false);
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (discordTimeout) clearTimeout(discordTimeout);
      if (googleTimeout) clearTimeout(googleTimeout);
    };
  }, [isDiscordLoading, isGoogleLoading]);

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
      
      console.log("Starting Discord login...");
      const result = await signIn.social({
        provider: "discord",
      });
      console.log("Discord login result:", result);
      
      // Don't navigate immediately - let the useEffect handle navigation
      // when the authentication state changes
    } catch (error) {
      console.error("Discord login error:", error);
      
      let errorMessage = "Discord login is not fully configured yet. ";
      
      if (error && typeof error === 'object' && 'error' in error) {
        const authError = error.error as any;
        if (authError?.status === 404) {
          errorMessage += "The Discord OAuth endpoints are not accessible. ";
        }
      }
      
      errorMessage += "Please use the demo mode to explore the app, or contact support to set up Discord authentication.";
      
      Alert.alert(
        "Discord Login Unavailable",
        errorMessage,
        [
          { text: "OK", style: "default" },
          {
            text: "Try Demo Mode",
            style: "default",
            onPress: () => handleDemoLogin()
          }
        ]
      );
      setIsDiscordLoading(false);
    }
    // Note: Don't set loading to false here if login succeeded
    // Let the useEffect handle it when auth state changes
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
      
      console.log("Starting Google login...");
      const result = await signIn.social({
        provider: "google",
      });
      console.log("Google login result:", result);
      
      // Don't navigate immediately - let the useEffect handle navigation
      // when the authentication state changes
    } catch (error) {
      console.error("Google login error:", error);
      
      let errorMessage = "Google login is not fully configured yet. ";
      
      if (error && typeof error === 'object' && 'error' in error) {
        const authError = error.error as any;
        if (authError?.status === 404) {
          errorMessage += "The Google OAuth endpoints are not accessible. ";
        }
      }
      
      errorMessage += "Please use the demo mode to explore the app, or contact support to set up Google authentication.";
      
      Alert.alert(
        "Google Login Unavailable",
        errorMessage,
        [
          { text: "OK", style: "default" },
          {
            text: "Try Demo Mode",
            style: "default",
            onPress: () => handleDemoLogin()
          }
        ]
      );
      setIsGoogleLoading(false);
    }
    // Note: Don't set loading to false here if login succeeded
    // Let the useEffect handle it when auth state changes
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
              router.replace("/(app)/history");
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to enter demo mode. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView 
      style={{ 
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: top, 
        paddingBottom: bottom 
      }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 32
        }}
      >
        {/* Header Section */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🤖</Text>
            <H1>Welcome Back</H1>
          </View>
          <Text style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            lineHeight: 20,
            maxWidth: 300
          }}>
            Sign in to continue your AI conversations and access your chat history
          </Text>
        </View>

        {/* Main Login Card */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          marginBottom: 24,
          padding: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: 8
            }}>Choose your sign-in method</Text>
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Select one of the options below to get started
            </Text>
          </View>
            {/* Discord Button */}
            <Button
              variant="default"
              size="lg"
              onPress={handleDiscordLogin}
              disabled={isDiscordLoading || isGoogleLoading}
              isLoading={isDiscordLoading}
              style={{
                backgroundColor: '#5865F2',
                marginBottom: 12
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!isDiscordLoading && (
                  <Text style={{ 
                    fontSize: 18, 
                    color: '#ffffff', 
                    marginRight: 8 
                  }}>📱</Text>
                )}
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Continue with Discord
                </Text>
              </View>
            </Button>

            {/* Google Button */}
            <Button
              variant="outline"
              size="lg"
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading || isDiscordLoading}
              isLoading={isGoogleLoading}
              style={{ marginBottom: 20 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!isGoogleLoading && (
                  <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
                )}
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  Continue with Google
                </Text>
              </View>
            </Button>

            {/* Divider */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginVertical: 20 
            }}>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: '#e5e7eb' 
              }} />
              <Text style={{ 
                marginHorizontal: 16, 
                fontSize: 12, 
                color: '#6b7280' 
              }}>OR</Text>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: '#e5e7eb' 
              }} />
            </View>

            {/* Demo Button */}
            <Button
              variant="secondary"
              size="lg"
              onPress={handleDemoLogin}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🎭</Text>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  Continue as Demo
                </Text>
              </View>
            </Button>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 12, 
            color: '#6b7280',
            lineHeight: 16,
            maxWidth: 300
          }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your data is encrypted and secure.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
