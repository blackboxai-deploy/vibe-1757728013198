export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  joinedAt: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'code' | 'file' | 'ai-generated';
  timestamp: Date;
  edited?: Date;
  reactions?: { [emoji: string]: string[] }; // emoji -> user IDs
  readBy: string[];
  metadata?: {
    aiModel?: string;
    generationTime?: number;
    prompt?: string;
    language?: string; // for code messages
    fileName?: string; // for file messages
    url?: string; // for AI-generated content URLs
  };
}

export interface DirectMessage {
  id: string;
  participants: [string, string]; // exactly 2 participants
  messages: Message[];
  lastActivity: Date;
}

export interface TypingIndicator {
  userId: string;
  roomId: string;
  timestamp: Date;
}

export interface ChatState {
  currentUser: User | null;
  users: { [id: string]: User };
  rooms: { [id: string]: ChatRoom };
  messages: { [roomId: string]: Message[] };
  directMessages: { [conversationId: string]: DirectMessage };
  currentRoomId: string | null;
  currentDMId: string | null;
  typingIndicators: TypingIndicator[];
  isConnected: boolean;
  unreadCounts: { [roomId: string]: number };
}