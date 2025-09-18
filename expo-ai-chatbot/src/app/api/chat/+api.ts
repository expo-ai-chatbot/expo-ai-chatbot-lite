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
    const chatId = url.searchParams.get('id');

    if (chatId) {
      // Get specific chat with messages
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!chat) {
        return Response.json({ error: "Chat not found" }, { status: 404 });
      }

      return Response.json(chat);
    } else {
      // Get all chats for user
      const chats = await prisma.chat.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return Response.json(chats);
    }
  } catch (error) {
    console.error('Error fetching chat:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, messages } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        title,
        userId: session.user.id,
        messages: {
          create: messages?.map((message: any) => ({
            role: message.role,
            content: message.content,
          })) || []
        }
      },
      include: {
        messages: true
      }
    });

    return Response.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, title, messages } = body;

    if (!chatId) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Check if chat exists and belongs to user
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      }
    });

    if (!existingChat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // Update chat and add new messages
    const updatedChat = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        ...(title && { title }),
        updatedAt: new Date(),
        ...(messages && {
          messages: {
            create: messages.map((message: any) => ({
              role: message.role,
              content: message.content,
            }))
          }
        })
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return Response.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const chatId = url.searchParams.get('id');

    if (!chatId) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Check if chat exists and belongs to user
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      }
    });

    if (!existingChat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete chat (messages will be deleted due to cascade)
    await prisma.chat.delete({
      where: {
        id: chatId,
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
