import { clsx, type ClassValue } from "clsx";
import { Platform } from "react-native";
import { twMerge } from "tailwind-merge";
import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  ModelMessage,
} from "ai";

// Define a simple DBMessage type for the conversion function
type DBMessage = {
  id: string;
  parts: any;
  role: string;
  createdAt?: Date;
};

type Document = {
  createdAt: Date;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidYoutubeUrl(url: string) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

export function isWeb() {
  return Platform.OS === "web";
}
export function isNative() {
  return Platform.OS === "ios" || Platform.OS === "android";
}
export function isIOS() {
  return Platform.OS === "ios";
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Convert database messages to UIMessage format (v5)
export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<UIMessage> {
  return messages.map((message) => {
    // Extract tool invocations from parts array for backward compatibility
    const toolInvocations: any[] = [];

    if (message.parts && Array.isArray(message.parts)) {
      message.parts.forEach((part: any) => {
        if (part.type && part.type.startsWith('tool-')) {
          const toolName = part.type.replace('tool-', '');
          toolInvocations.push({
            toolName,
            toolCallId: part.toolCallId,
            state: part.state || 'result',
            input: part.input,
            output: part.output,
            result: part.result || part.output,
          });
        }
      });
    }

    return {
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role as UIMessage["role"],
      createdAt: message.createdAt,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
    };
  });
}

export function sanitizeResponseMessages(
  messages: Array<CoreToolMessage | CoreAssistantMessage>,
): Array<CoreToolMessage | CoreAssistantMessage> {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === "tool") {
      for (const content of message.content) {
        if (content.type === "tool-result") {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== "assistant") return message;

    if (typeof message.content === "string") return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === "tool-call"
        ? toolResultIds.includes(content.toolCallId)
        : content.type === "text"
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

// In v5, we filter based on parts instead of content/toolInvocations
export function sanitizeUIMessages(messages: Array<UIMessage>): Array<UIMessage> {
  return messages.filter(
    (message) => message.parts && message.parts.length > 0,
  );
}

export function getMostRecentUserMessage(messages: Array<ModelMessage>) {
  const userMessages = messages.filter((message) => message.role === "user");
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getMessageIdFromAnnotations(message: UIMessage) {
  // In v5, annotations are part of message metadata
  const metadata = message.metadata as any;
  if (metadata?.messageIdFromServer) {
    return metadata.messageIdFromServer;
  }
  return message.id;
}
