import { supermemoryTools, withSupermemory } from "@supermemory/tools/ai-sdk";
import type { Session } from "next-auth";
import type { LanguageModelV1 } from "ai";

type SupermemoryToolsProps = {
  session: Session;
};

export const getSupermemoryTools = ({ session }: SupermemoryToolsProps) => {
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    console.warn("SUPERMEMORY_API_KEY not configured, memory features disabled");
    return {};
  }

  try {
    // Use user ID as containerTags for per-user memory isolation
    const tools = supermemoryTools(apiKey, {
      containerTags: [session.user.id],
    });

    return tools;
  } catch (error) {
    console.error("Failed to initialize Supermemory tools:", error);
    return {};
  }
};

export const wrapModelWithMemory = (
  model: LanguageModelV1,
  session: Session,
  chatId: string
): LanguageModelV1 => {
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    console.warn("SUPERMEMORY_API_KEY not configured, returning unwrapped model");
    return model;
  }

  try {
    // Use withSupermemory middleware for automatic memory injection
    const wrappedModel = withSupermemory(model, session.user.id, {
      apiKey,
      mode: "full", // Use both profile and query-based memories
      addMemory: "always", // Automatically save conversations
      conversationId: chatId, // Group by chat for context
      verbose: true, // Enable logging for debugging
    });

    console.log("🧠 Supermemory middleware enabled for user:", session.user.id);
    return wrappedModel;
  } catch (error) {
    console.error("Failed to wrap model with Supermemory:", error);
    return model;
  }
};
