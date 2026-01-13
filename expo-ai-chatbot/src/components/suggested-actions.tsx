import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { ScrollAdapt } from "@/components/scroll-adapt";
import { useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useStore } from "@/lib/globalStore";
import { generateUUID } from "@/lib/utils";

interface SuggestedActionsProps {
  hasInput?: boolean;
  sendMessage: (options: { text: string }) => Promise<void>;
}

export function SuggestedActions({
  hasInput = false,
  sendMessage,
}: SuggestedActionsProps) {
  const { selectedImageUris, setChatId } = useStore();
  const { width } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);

  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(
      hasInput || selectedImageUris.length > 0 ? 0 : 1,
      {
        duration: 200,
      },
    );
  }, [hasInput, selectedImageUris]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = async (action: string) => {
    const newChatId = generateUUID();
    setChatId({ id: newChatId, from: "newChat" });

    // Send the initial message using sendMessage (v5 API)
    await sendMessage({
      text: action,
    });
  };

  const actions = [
    {
      title: "What's the weather forecast",
      label:
        "Get detailed weather information for San Francisco, including temperature and wind speed.",
      action: "What is the weather in San Francisco today?",
    },
    {
      title: "Help me write an essay",
      label:
        "Create a well-researched essay exploring Silicon Valley's history, tech culture, innovation ecosystem and global impact",
      action: "Help me draft a short essay about Silicon Valley",
    },
    {
      title: "Get stock market analysis",
      label:
        "Check current stock prices, market trends, trading volume and key financial metrics for any publicly traded company",
      action: "What is the current stock price of Apple (AAPL)?",
    },
  ];

  return (
    <Animated.View style={animatedStyle}>
      <ScrollAdapt withSnap itemWidth={cardWidth}>
        {actions.map((item, i) => (
          <Pressable key={item.action} onPress={() => handlePress(item.action)}>
            <View
              onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
              className={cn(
                "mb-3 mr-2.5 h-32 w-[280px] rounded-lg border border-gray-200 bg-white p-4 dark:bg-black",
              )}
              style={{
                ...(i === actions.length - 1 && {
                  marginRight: width - cardWidth,
                }),
              }}
            >
              <Text className="text-lg font-semibold">{item.title}</Text>
              <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {item.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollAdapt>
    </Animated.View>
  );
}
