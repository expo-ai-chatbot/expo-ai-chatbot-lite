import type React from "react";
import {
  View,
  type TextInput,
  KeyboardAvoidingView,
  Keyboard,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Paperclip, ArrowUp, X } from "lucide-react-native";
import { Button } from "./button";
import Animated, {
  useAnimatedStyle,
  useAnimatedKeyboard,
  withSpring,
  FadeIn,
  FadeOut,
  withTiming,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatTextInput } from "./chat-text-input";
import { forwardRef, useEffect, useState } from "react";
import { useImagePicker } from "@/hooks/useImagePicker";
import { Image } from "expo-image";
import { useStore } from "@/lib/globalStore";

type Props = {
  input: string;
  onChangeText: (text: string) => void;
  onSubmit: (message: string) => void;
  scrollViewRef: React.RefObject<ScrollView>;
  focusOnMount?: boolean;
};

interface SelectedImagesProps {
  uris: string[];
  onRemove: (uri: string) => void;
}

interface ImageItemProps {
  uri: string;
  onRemove: (uri: string) => void;
}

const ImageItem = ({ uri, onRemove }: ImageItemProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Animated.View
      key={uri}
      className="relative"
      entering={FadeIn.delay(150).springify()}
    >
      <Image
        source={{ uri }}
        style={{
          width: 55,
          height: 55,
          borderRadius: 6,
        }}
        contentFit="cover"
        onLoadEnd={() => setTimeout(() => setIsLoading(false), 2000)}
      >
        {isLoading && (
          <Animated.View className="h-[55px] w-[55px] items-center justify-center rounded-md bg-gray-300 dark:bg-gray-600">
            <ActivityIndicator size="small" color="white" />
          </Animated.View>
        )}
      </Image>
      <Pressable
        onPress={() => onRemove(uri)}
        className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full bg-gray-200"
      >
        <X size={12} color="black" />
      </Pressable>
    </Animated.View>
  );
};

const SelectedImages = ({ uris, onRemove }: SelectedImagesProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(uris.length === 0 ? 0 : 65, {
        duration: 200,
      }),
    };
  }, [uris.length]);

  return (
    <Animated.View
      className="overflow-hidden"
      style={[animatedStyle]}
      entering={FadeIn.delay(150).springify()}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        className="mb-4 overflow-visible px-4 py-2"
        style={{ minHeight: 65 }}
      >
        <View className="flex-row gap-4">
          {uris.map((uri) => (
            <ImageItem key={uri} uri={uri} onRemove={onRemove} />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export const ChatInput = forwardRef<TextInput, Props>(
  (
    { input, onChangeText, onSubmit, scrollViewRef, focusOnMount = false },
    ref,
  ) => {
    const { bottom } = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();
    const { pickImage } = useImagePicker();
    const { selectedImageUris, addImageUri, removeImageUri } = useStore();

    useEffect(() => {
      if (focusOnMount) {
        (ref as React.RefObject<TextInput>).current?.focus();
      }
    }, [focusOnMount]);

    useEffect(() => {
      const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
      const focusSubscription = Keyboard.addListener("keyboardWillShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      // const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      //   scrollViewRef.current?.scrollToEnd({ animated: true });
      // });

      return () => {
        showSubscription.remove();
        // hideSubscription.remove();
      };
    }, [scrollViewRef]);

    const animatedStyles = useAnimatedStyle(() => ({
      paddingBottom: withSpring(keyboard.height.value - bottom, {
        damping: 20,
        stiffness: 200,
      }),
    }));

    const colorScheme = useColorScheme();

    const handleAttachmentSelect = async (type: "photo" | "file") => {
      if (type === "photo") {
        const imageUris = await pickImage();
        if (imageUris) {
          imageUris.forEach((uri) => {
            addImageUri(uri);
          });
        }
      }
    };

    return (
      <KeyboardAvoidingView>
        <Animated.View style={animatedStyles}>
          <SelectedImages uris={selectedImageUris} onRemove={removeImageUri} />
          <View className="flex-row items-end gap-2 bg-background px-4 py-2">
            <ChatTextInput
              ref={ref}
              className="flex-1 rounded-[20] bg-muted py-[8]"
              placeholder="Message"
              multiline
              value={input}
              onChangeText={onChangeText}
            />
            <Button
              size="icon"
              className="android:h-12 android:w-12 rounded-full bg-black dark:bg-white"
              onPress={() => {
                onSubmit(input);
                Keyboard.dismiss();
              }}
            >
              <ArrowUp
                color={colorScheme === "dark" ? "black" : "white"}
                size={20}
                className="h-6 w-6"
              />
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  },
);
