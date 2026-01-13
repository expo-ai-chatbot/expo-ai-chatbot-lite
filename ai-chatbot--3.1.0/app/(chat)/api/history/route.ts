import type { NextRequest } from "next/server";
import { auth, type UserType } from "@/app/(auth)/auth";
import { deleteAllChatsByUserId, getChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { verifyToken, extractTokenFromHeader } from "@/lib/native-auth/tokens";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  // Try token auth first for mobile clients
  let userId: string | undefined;

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }
  }

  // If no token auth, try session auth
  if (!userId) {
    const session = await auth();
    if (session?.user) {
      userId = session.user.id;
    }
  }

  if (!userId) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE(request: NextRequest) {
  // Try token auth first for mobile clients
  let userId: string | undefined;

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }
  }

  // If no token auth, try session auth
  if (!userId) {
    const session = await auth();
    if (session?.user) {
      userId = session.user.id;
    }
  }

  if (!userId) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const result = await deleteAllChatsByUserId({ userId });

  return Response.json(result, { status: 200 });
}
