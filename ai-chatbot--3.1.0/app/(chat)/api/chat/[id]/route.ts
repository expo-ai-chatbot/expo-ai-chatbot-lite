import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import { verifyToken, extractTokenFromHeader } from '@/lib/native-auth/tokens';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get chat data
    const chat = await getChatById({ id });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    // Authentication - try token first, then session
    let userId: string | undefined;
    let session: any = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          userId = payload.id;
          session = { user: { id: userId } };
        }
      }
    }

    // If no token auth, try session auth
    if (!userId) {
      session = await auth();
      if (session?.user) {
        userId = session.user.id;
      }
    }

    if (!userId) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Check chat visibility and permissions
    if (chat.visibility === 'private') {
      if (userId !== chat.userId) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    // Get messages
    const messagesFromDb = await getMessagesByChatId({ id });

    console.log(">>> messagesFromDb", JSON.stringify(messagesFromDb, null, 2));

    const uiMessages = messagesFromDb;

    // Determine if readonly
    const isReadonly = userId !== chat.userId;

    // Get chat model from cookie or use default
    const chatModelCookie = request.cookies.get('chat-model');
    const chatModel = chatModelCookie?.value || DEFAULT_CHAT_MODEL;

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        visibility: chat.visibility,
        userId: chat.userId,
        createdAt: chat.createdAt,
      },
      messages: uiMessages,
      chatModel,
      isReadonly,
      session: {
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        } : null,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/chat/[id]:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
