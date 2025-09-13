import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo
const messages = new Map<string, any[]>(); // roomId -> messages[]
const rooms = new Map<string, any>(); // roomId -> room info

// Initialize default rooms
if (!rooms.has('general')) {
  const defaultRooms = [
    {
      id: 'general',
      name: 'General',
      description: 'General discussion for everyone',
      type: 'public',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'ai-showcase',
      name: 'AI Showcase',
      description: 'Share your AI-generated images, videos, and code',
      type: 'public',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tech-talk',
      name: 'Tech Talk',
      description: 'Discuss technology, programming, and development',
      type: 'public',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'random',
      name: 'Random',
      description: 'Random conversations and fun stuff',
      type: 'public',
      members: [],
      createdAt: new Date().toISOString()
    }
  ];

  defaultRooms.forEach(room => {
    rooms.set(room.id, room);
    messages.set(room.id, []);
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const action = searchParams.get('action');

    switch (action) {
      case 'rooms':
        const allRooms = Array.from(rooms.values());
        return NextResponse.json({ 
          success: true,
          rooms: allRooms 
        });

      case 'messages':
        if (!roomId) {
          return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
        }

        const roomMessages = messages.get(roomId) || [];
        return NextResponse.json({ 
          success: true,
          messages: roomMessages,
          roomId 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, userId } = body;
    let { roomId } = body;

    switch (action) {
      case 'send':
        if (!roomId || !message || !userId) {
          return NextResponse.json({ 
            error: 'Room ID, message, and user ID are required' 
          }, { status: 400 });
        }

        // Ensure room exists
        if (!rooms.has(roomId)) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Create message object
        const newMessage = {
          id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomId,
          senderId: userId,
          content: message.content,
          type: message.type || 'text',
          timestamp: new Date().toISOString(),
          readBy: [userId],
          metadata: message.metadata || {}
        };

        // Add to room messages
        const roomMessages = messages.get(roomId) || [];
        roomMessages.push(newMessage);
        messages.set(roomId, roomMessages);

        return NextResponse.json({ 
          success: true, 
          message: newMessage 
        });

      case 'mark-read':
        if (!roomId || !userId) {
          return NextResponse.json({ 
            error: 'Room ID and user ID are required' 
          }, { status: 400 });
        }

        const roomMsgs = messages.get(roomId) || [];
        let updatedCount = 0;

        roomMsgs.forEach(msg => {
          if (!msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
            updatedCount++;
          }
        });

        messages.set(roomId, roomMsgs);

        return NextResponse.json({ 
          success: true, 
          updatedCount 
        });

      case 'create-room':
        const { name, description, type = 'public' } = body;

        if (!name) {
          return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
        }

        roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRoom = {
          id: roomId,
          name: name.trim(),
          description: description?.trim() || '',
          type,
          members: [userId],
          createdAt: new Date().toISOString()
        };

        rooms.set(roomId, newRoom);
        messages.set(roomId, []);

        return NextResponse.json({ 
          success: true, 
          room: newRoom 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}