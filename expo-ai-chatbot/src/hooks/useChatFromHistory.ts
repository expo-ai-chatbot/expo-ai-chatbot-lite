import { useState, useEffect } from "react";
import type { UIMessage } from "ai";
import { convertToUIMessages } from "@/lib/utils";

type ChatIdState = {
  id: string;
  from: "history" | "newChat";
} | null;

interface UseChatFromHistoryProps {
  chatId: ChatIdState;
  token: string | null;
}

export function useChatFromHistory({ chatId, token }: UseChatFromHistoryProps) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chatId?.id && chatId.from === "history" && token) {
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat/${chatId.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const { messages } = res;
          console.log(">>> messages from history:", messages);

          if (messages && messages.length) {
            const uiMessages = convertToUIMessages(messages);
            console.log(">>> uiMessages:", uiMessages);
            setInitialMessages(uiMessages);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(">>> Error fetching chat messages:", err);
          setInitialMessages([]);
          setLoading(false);
        });
    }
  }, [chatId, token]);

  return { initialMessages, loading };
}
