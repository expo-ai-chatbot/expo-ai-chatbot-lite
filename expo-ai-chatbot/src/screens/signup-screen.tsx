import React from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/auth/useAuth";
import { Link, router } from "expo-router";
import { z } from 'zod/v4';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
      });
      router.replace("/(app)");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      className="bg-background"
    >
      <Form {...form}>
        <View className="native:w-full mt-10 gap-2 rounded-3xl px-5 py-10 web:w-[400px]">
          <Text className="mb-6 text-center text-2xl font-semibold">
            Sign up to get started
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
                      placeholder="email@address.com"
                      autoCapitalize="none"
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
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Password"
                      autoCapitalize="none"
                      secureTextEntry={true}
                      onSubmitEditing={onSubmit}
                      returnKeyType="go"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </View>
          <Button className="min-w-full" disabled={loading} onPress={onSubmit}>
            <Text className="">Sign up</Text>
          </Button>
          <Text className="text-md pt-2 text-center">
            Already have an account?{" "}
            <Link href="/signin" asChild>
              <Text className="text-md underline">Sign in</Text>
            </Link>
          </Text>
        </View>
      </Form>
    </KeyboardAvoidingView>
  );
}
