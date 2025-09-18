import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const endingBefore = url.searchParams.get('ending_before');

    let whereClause: any = {
      userId: session.user.id,
    };

    // Add cursor-based pagination if ending_before is provided
    if (endingBefore) {
      whereClause.createdAt = {
        lt: (await prisma.chat.findUnique({
          where: { id: endingBefore },
          select: { createdAt: true }
        }))?.createdAt
      };
    }

    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1, // Get one extra to check if there are more
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    const hasMore = chats.length > limit;
    const chatList = hasMore ? chats.slice(0, -1) : chats;

    return Response.json({
      chats: chatList,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
