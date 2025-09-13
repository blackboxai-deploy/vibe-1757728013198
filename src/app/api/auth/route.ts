import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo
const users = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, userId } = body;

    switch (action) {
      case 'login':
        if (!username || typeof username !== 'string') {
          return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Check if username is available
        const existingUser = Array.from(users.values()).find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        // Create new user
        const newUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: username.trim(),
          status: 'online',
          joinedAt: new Date().toISOString()
        };

        users.set(newUser.id, newUser);

        return NextResponse.json({
          success: true,
          user: newUser
        });

      case 'logout':
        if (userId && users.has(userId)) {
          const user = users.get(userId);
          user.status = 'offline';
          users.set(userId, user);
        }
        
        return NextResponse.json({ success: true });

      case 'status':
        if (!userId || !users.has(userId)) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users.get(userId);
        user.status = body.status || 'online';
        users.set(userId, user);

        return NextResponse.json({ success: true, user });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'users':
        const allUsers = Array.from(users.values());
        return NextResponse.json({ users: allUsers });

      case 'check-username':
        const username = searchParams.get('username');
        if (!username) {
          return NextResponse.json({ error: 'Username parameter required' }, { status: 400 });
        }

        const exists = Array.from(users.values()).some(u => 
          u.username.toLowerCase() === username.toLowerCase()
        );

        return NextResponse.json({ available: !exists });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}