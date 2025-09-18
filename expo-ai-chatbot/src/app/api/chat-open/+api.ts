import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { streamText, convertToCoreMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, modelId } = await request.json();

    // Convert messages to the format expected by AI SDK
    const coreMessages = convertToCoreMessages(messages);

    // Generate a title for the chat if this is the first message
    let chatTitle = 'New Chat';
    if (messages.length === 1 && messages[0].role === 'user') {
      // Use the first few words of the user's message as the title
      const userMessage = messages[0].content;
      chatTitle = typeof userMessage === 'string' 
        ? userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
        : 'New Chat';
    }

    // Stream the AI response
    const result = await streamText({
      model: openai(modelId || 'gpt-4o-mini'),
      messages: coreMessages,
      async onFinish({ text, finishReason }) {
        try {
          // Save or update the chat in the database after the response is complete
          const url = new URL(request.url);
          const chatId = url.searchParams.get('chatId') || messages[0]?.id?.split('-')[0];
          
          if (chatId) {
            // Check if chat already exists
            const existingChat = await prisma.chat.findFirst({
              where: {
                id: chatId,
                userId: session.user.id,
              }
            });

            if (existingChat) {
              // Add the new messages to existing chat
              await prisma.message.createMany({
                data: [
                  {
                    chatId: chatId,
                    role: messages[messages.length - 1].role,
                    content: messages[messages.length - 1].content,
                  },
                  {
                    chatId: chatId,
                    role: 'assistant',
                    content: text,
                  }
                ]
              });

              // Update the chat's updatedAt timestamp
              await prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() }
              });
            } else {
              // Create new chat with all messages
              await prisma.chat.create({
                data: {
                  id: chatId,
                  title: chatTitle,
                  userId: session.user.id,
                  messages: {
                    create: [
                      ...messages.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                      })),
                      {
                        role: 'assistant',
                        content: text,
                      }
                    ]
                  }
                }
              });
            }
          }
        } catch (error) {
          console.error('Error saving chat to database:', error);
          // Don't fail the entire request if database save fails
        }
      },
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Error in chat-open API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
