import { View, ScrollView, ActivityIndicator } from "react-native";

// import Markdown from "react-native-markdown-display";
import { CustomMarkdown } from "@/components/ui/markdown";
import { useKeyboard } from "@react-native-community/hooks";
import { Text } from "@/components/ui/text";
import WeatherCard from "@/components/weather";
import { WelcomeMessage } from "@/components/welcome-message";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LottieLoader } from "@/components/lottie-loader";

type ToolInvocation = {
  toolName: string;
  toolCallId: string;
  state: string;
  result?: any;
  output?: any; // AI SDK 5 uses 'output' instead of 'result'
};

type TextPart = {
  type: "text";
  text: string;
};

type MessagePart = TextPart | { type: string; [key: string]: any };

// AI SDK 5 message structure uses parts array
type Message = {
  id: string;
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  parts?: MessagePart[];
  toolInvocations?: ToolInvocation[];
};

type ChatInterfaceProps = {
  messages: Message[];
  scrollViewRef: React.RefObject<ScrollView>;
  isLoading?: boolean;
};

export const ChatInterface = forwardRef<ScrollView, ChatInterfaceProps>(
  ({ messages, scrollViewRef, isLoading }, ref) => {
    const { keyboardShown, keyboardHeight } = useKeyboard();

    // Helper to get text content from message parts (AI SDK 5)
    const getTextContent = (m: Message): string => {
      if (m.parts && Array.isArray(m.parts)) {
        return m.parts
          .filter((part): part is TextPart => part.type === "text" && typeof part.text === "string")
          .map((part) => part.text)
          .join("");
      }
      return "";
    };

    // Helper to check if message has text content
    const hasTextContent = (m: Message): boolean => {
      return getTextContent(m).trim().length > 0;
    };

    return (
      <View className="flex-1">
        <ScrollView ref={ref} className="flex-1 space-y-4 p-4">
          {!messages.length && <WelcomeMessage />}
          {messages.length > 0
            ? messages.map((m, index) => (
                <React.Fragment key={m.id}>
                  {m.toolInvocations?.map((t) => {
                    if (t.toolName === "getWeather") {
                      // AI SDK 5 uses 'output', fallback to 'result' for compatibility
                      const weatherData = t.output || t.result;

                      if (t.state !== "result" && !weatherData) {
                        return (
                          <View
                            key={t.toolCallId}
                            className={cn(
                              "mt-4 max-w-[85%] rounded-2xl bg-muted/50 p-4",
                            )}
                          >
                            <ActivityIndicator size="small" color="black" />
                            <Text>Getting weather data...</Text>
                          </View>
                        );
                      }
                      if (weatherData) {
                        return (
                          <WeatherCard
                            key={t.toolCallId}
                            city={weatherData.city || "Unknown"}
                            temperature={weatherData.current.temperature_2m}
                            weatherCode={weatherData.current.weathercode}
                            humidity={weatherData.current.relative_humidity_2m}
                            wind={weatherData.current.wind_speed_10m}
                          />
                        );
                      }
                    }
                    return null;
                  })}

                  <View
                    className={`flex-row px-4 ${m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[95%] pl-0"} rounded-3xl ${m.role === "user" ? "bg-muted/50" : ""} `}
                  >
                    {hasTextContent(m) && (
                      <>
                        <View
                          className={
                            m.role === "user"
                              ? ""
                              : "mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-gray-200"
                          }
                        >
                          <Text className="text-base">
                            {m.role === "user" ? "" : "🤖"}
                          </Text>
                        </View>
                        <CustomMarkdown content={getTextContent(m)} />
                      </>
                    )}
                  </View>
                  {isLoading &&
                    messages[messages.length - 1].role === "user" &&
                    m === messages[messages.length - 1] && (
                      <View className="flex-row">
                        <View
                          className={
                            "mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-gray-200"
                          }
                        >
                          <Text className="text-base">{"🤖"}</Text>
                        </View>
                        <View className="-ml-2 -mt-[1px]">
                          <LottieLoader width={40} height={40} />
                        </View>
                      </View>
                    )}
                </React.Fragment>
              ))
            : null}
        </ScrollView>
      </View>
    );
  },
);
