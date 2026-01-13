import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { openai } from "@ai-sdk/openai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { generateImage } from "@/lib/ai/tools/generate-image";
import { getSupermemoryTools, wrapModelWithMemory } from "@/lib/ai/tools/supermemory";
import { isProductionEnvironment } from "@/lib/constants";
import { verifyToken, extractTokenFromHeader } from "@/lib/native-auth/tokens";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      searchEnabled,
      memoryEnabled,
      incognitoMode,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
      searchEnabled?: boolean;
      memoryEnabled?: boolean;
      incognitoMode?: boolean;
    } = requestBody;

    console.log('🔍 Request params:', {
      selectedChatModel,
      searchEnabled,
      memoryEnabled,
      incognitoMode,
      messageText: message.parts.find(p => p.type === 'text')?.text?.substring(0, 50)
    });

    // Try token auth first for mobile clients
    let userId: string | undefined;
    let userType: UserType = 'regular';
    let session: any = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          userId = payload.id;
          userType = 'regular';
          session = { user: { id: userId, type: userType } };
        }
      }
    }

    // If no token auth, try session auth
    if (!userId) {
      session = await auth();
      if (session?.user) {
        userId = session.user.id;
        userType = session.user.type;
      }
    }

    if (!userId) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check if request is from mobile app (has Authorization token)
    const isMobileRequest = authHeader && extractTokenFromHeader(authHeader);

    // Only apply rate limit for web requests, not mobile app
    if (!isMobileRequest) {
      const messageCount = await getMessageCountByUserId({
        id: userId,
        differenceInHours: 24,
      });

      if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }
    }

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== userId) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists
      messagesFromDb = await getMessagesByChatId({ id });
    } else {
      // Save chat immediately with placeholder title
      await saveChat({
        id,
        userId: userId,
        title: "New chat",
        visibility: selectedVisibilityType,
      });

      // Start title generation in parallel (don't await)
      titlePromise = generateTitleFromUserMessage({ message });
    }

    // Helper function to process file parts - fetch file contents for AI SDK
    async function processFileParts(parts: any[]) {
      const processed = await Promise.all(
        parts.map(async (part) => {
          if (part.type === "file" && part.url) {
            try {
              console.log("📄 Fetching file:", part.url, "mediaType:", part.mediaType);
              const response = await fetch(part.url);
              if (!response.ok) {
                console.error("Failed to fetch file:", part.url, response.statusText);
                return null; // Mark as failed
              }

              const buffer = await response.arrayBuffer();
              console.log("📄 File fetched successfully:", part.filename || "file", "Size:", buffer.byteLength);

              // Return the file part with data for AI SDK v5
              // Only include type, data, and mediaType - no filename or url
              return {
                type: "file" as const,
                data: Buffer.from(buffer),
                mediaType: part.mediaType,
              };
            } catch (error) {
              console.error("Error fetching file:", part.url, error);
              return null; // Mark as failed
            }
          }
          return part;
        })
      );

      // Filter out any failed file fetches (null values)
      return processed.filter((p) => p !== null);
    }

    // Process file attachments in current message
    console.log("📄 Processing message parts:", JSON.stringify(message.parts, null, 2));
    const processedParts = await processFileParts(message.parts);
    console.log("📄 Processed parts count:", processedParts.length);

    // Create processed message with file data
    const processedMessage = {
      ...message,
      parts: processedParts,
    };

    // Process file attachments in messages from database
    const uiMessagesFromDb = convertToUIMessages(messagesFromDb);
    const processedDbMessages = await Promise.all(
      uiMessagesFromDb.map(async (msg) => ({
        ...msg,
        parts: await processFileParts(msg.parts),
      }))
    );

    const uiMessages = [...processedDbMessages, processedMessage];

    console.log("📋 Final uiMessages count:", uiMessages.length);
    console.log("📋 Last message parts:", JSON.stringify(uiMessages[uiMessages.length - 1].parts.map(p => ({ ...p, data: p.data ? `<Buffer ${p.data.length} bytes>` : undefined })), null, 2));

    // Log all messages structure for debugging
    console.log("📋 All messages summary:");
    uiMessages.forEach((msg, idx) => {
      const partsInfo = msg.parts.map(p => {
        if (p.type === 'file') {
          return `file(${p.mediaType}, ${p.data ? 'has data' : 'NO DATA'})`;
        } else if (p.type === 'text') {
          return `text("${p.text?.substring(0, 20)}...")`;
        } else {
          return p.type;
        }
      });
      console.log(`  [${idx}] ${msg.role}: [${partsInfo.join(', ')}]`);
    });

    const { longitude, latitude, city, country} = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Only save messages if not in incognito mode
    if (!incognitoMode) {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    } else {
      console.log("👻 Incognito mode: Skipping user message save");
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Handle title generation in parallel
        if (titlePromise) {
          titlePromise.then((title) => {
            updateChatTitleById({ chatId: id, title });
            dataStream.write({ type: "data-chat-title", data: title });
          });
        }

        const isReasoningModel =
          selectedChatModel.includes("reasoning") ||
          selectedChatModel.includes("thinking");

        console.log('🛠️  Tools config:', {
          searchEnabled,
          memoryEnabled,
          incognitoMode,
          isReasoningModel,
          willIncludeSearch: !isReasoningModel && searchEnabled
        });

        // Wrap model with Supermemory middleware if memory is enabled and NOT in incognito mode
        const baseModel = getLanguageModel(selectedChatModel);
        const modelToUse = memoryEnabled && session?.user?.id && !incognitoMode
          ? wrapModelWithMemory(baseModel, session, id)
          : baseModel;

        // Also provide tools for explicit memory operations (skip in incognito mode)
        const supermemoryTools = memoryEnabled && session?.user?.id && !incognitoMode
          ? getSupermemoryTools({ session })
          : {};

        if (incognitoMode) {
          console.log("👻 Incognito mode: Skipping Supermemory integration");
        }

        // Convert UIMessages to ModelMessages while preserving file parts
        const modelMessages = uiMessages.map((msg) => ({
          role: msg.role,
          content: msg.parts.filter(p =>
            // Only include text and file parts, exclude metadata parts
            p.type === 'text' || p.type === 'file' || p.type === 'image'
          ),
        }));

        console.log("📤 Sending to AI - Message count:", modelMessages.length);
        modelMessages.forEach((msg, idx) => {
          const contentInfo = msg.content.map((p: any) => {
            if (p.type === 'text') return `text("${p.text?.substring(0, 30)}...")`;
            if (p.type === 'file') return `file(${p.mediaType}, ${p.data ? 'has data' : 'NO DATA'})`;
            if (p.type === 'image') return `image(...)`;
            return p.type;
          });
          console.log(`  📤 [${idx}] ${msg.role}: [${contentInfo.join(', ')}]`);
        });

        const result = streamText({
          model: modelToUse,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages as any,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : [
                "getWeather",
                "generateImage",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
                ...(searchEnabled ? ["web_search_preview" as const] : []),
                ...(memoryEnabled ? ["searchMemories", "addMemory"] : []),
              ],
          experimental_transform: isReasoningModel
            ? undefined
            : smoothStream({ chunking: "word" }),
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            getWeather,
            generateImage: generateImage({ dataStream }),
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            ...(searchEnabled ? {
              web_search_preview: openai.tools.webSearch({ searchContextSize: 'high' })
            } : {}),
            ...supermemoryTools,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        console.log("💾 onFinish called with", messages.length, "messages");
        messages.forEach((msg, idx) => {
          const partsInfo = msg.parts.map(p => {
            if (p.type === 'text') {
              return `text("${p.text?.substring(0, 50)}...")`;
            }
            return p.type;
          });
          console.log(`  💾 [${idx}] ${msg.role}: [${partsInfo.join(', ')}]`);
        });

        // Only save messages if not in incognito mode
        if (!incognitoMode) {
          await saveMessages({
            messages: messages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
          console.log("💾 Messages saved successfully");
        } else {
          console.log("👻 Incognito mode: Skipping assistant messages save");
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
