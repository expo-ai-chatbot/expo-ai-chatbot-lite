import React, { useEffect } from "react";
import { View, Platform, KeyboardAvoidingView } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/auth/useAuth";
import { Link, router } from "expo-router";
import { useForm } from "react-hook-form";
import { type LoginFormValues, loginSchema } from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export default function SigninScreen() {
  const { signIn, isLoading, session } = useAuth();

  // redirect to app if authenticated
  useEffect(() => {
    if (session) {
      router.replace("/(app)");
    }
  }, [session]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(signIn);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-background"
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Form {...form}>
        <View className="native:w-full mt-10 gap-2 rounded-3xl px-5 py-10 web:w-[400px]">
          <Text className="mb-6 text-center text-2xl font-semibold">
            Sign in
          </Text>
          <View className="self-stretch">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Email"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </View>
          <View className="self-stretch">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      autoCorrect={false}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Password"
                      autoCapitalize="none"
                      secureTextEntry={true}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="go"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </View>
          <Button
            isLoading={isLoading}
            onPress={handleSubmit}
            className="w-full"
          >
            <Text>Sign in</Text>
          </Button>
          <Text className="text-md pt-2 text-center">
            Don't have an account?{" "}
            <Link href="/signup" asChild>
              <Text className="text-md underline">Sign up</Text>
            </Link>
          </Text>
        </View>
      </Form>
    </KeyboardAvoidingView>
  );
}
