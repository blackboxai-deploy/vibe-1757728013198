'use client';

import { ChatState, User, ChatRoom, Message, TypingIndicator } from '@/types/chat';
import { getCurrentUser, getAllUsers } from './auth';

class ChatStore {
  private state: ChatState;
  private listeners: Set<() => void> = new Set();
  private storageKey = 'chat-app-state';

  constructor() {
    this.state = this.loadFromStorage() || this.getInitialState();
    this.initializeDefaultRooms();
    
    // Listen for storage changes (for multi-tab sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  private getInitialState(): ChatState {
    return {
      currentUser: getCurrentUser(),
      users: getAllUsers(),
      rooms: {},
      messages: {},
      directMessages: {},
      currentRoomId: null,
      currentDMId: null,
      typingIndicators: [],
      isConnected: false,
      unreadCounts: {}
    };
  }

  private initializeDefaultRooms(): void {
    if (Object.keys(this.state.rooms).length === 0) {
      const defaultRooms: ChatRoom[] = [
        {
          id: 'general',
          name: 'General',
          description: 'General discussion for everyone',
          type: 'public',
          members: [],
          createdAt: new Date()
        },
        {
          id: 'ai-showcase',
          name: 'AI Showcase',
          description: 'Share your AI-generated images, videos, and code',
          type: 'public',
          members: [],
          createdAt: new Date()
        },
        {
          id: 'tech-talk',
          name: 'Tech Talk',
          description: 'Discuss technology, programming, and development',
          type: 'public',
          members: [],
          createdAt: new Date()
        },
        {
          id: 'random',
          name: 'Random',
          description: 'Random conversations and fun stuff',
          type: 'public',
          members: [],
          createdAt: new Date()
        }
      ];

      defaultRooms.forEach(room => {
        this.state.rooms[room.id] = room;
        this.state.messages[room.id] = [];
        this.state.unreadCounts[room.id] = 0;
      });

      // Set default current room
      this.state.currentRoomId = 'general';
      this.saveToStorage();
    }
  }

  private loadFromStorage(): ChatState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      Object.values(state.rooms || {}).forEach((room: any) => {
        room.createdAt = new Date(room.createdAt);
      });
      
      Object.values(state.messages || {}).forEach((messages: any) => {
        messages.forEach((message: any) => {
          message.timestamp = new Date(message.timestamp);
          if (message.edited) message.edited = new Date(message.edited);
        });
      });
      
      Object.values(state.directMessages || {}).forEach((dm: any) => {
        dm.lastActivity = new Date(dm.lastActivity);
        dm.messages.forEach((message: any) => {
          message.timestamp = new Date(message.timestamp);
          if (message.edited) message.edited = new Date(message.edited);
        });
      });
      
      state.typingIndicators.forEach((indicator: any) => {
        indicator.timestamp = new Date(indicator.timestamp);
      });
      
      // Update with current user and all users
      state.currentUser = getCurrentUser();
      state.users = getAllUsers();
      
      return state;
    } catch (error) {
      console.error('Failed to load chat state from storage:', error);
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save chat state to storage:', error);
    }
  }

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === this.storageKey && e.newValue) {
      const newState = JSON.parse(e.newValue);
      this.state = { ...this.state, ...newState };
      this.notifyListeners();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Public methods
  getState(): ChatState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setCurrentUser(user: User | null): void {
    this.state.currentUser = user;
    if (user) {
      this.state.users[user.id] = user;
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  setCurrentRoom(roomId: string | null): void {
    this.state.currentRoomId = roomId;
    this.state.currentDMId = null;
    
    if (roomId) {
      this.state.unreadCounts[roomId] = 0;
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  setCurrentDM(dmId: string | null): void {
    this.state.currentDMId = dmId;
    this.state.currentRoomId = null;
    this.saveToStorage();
    this.notifyListeners();
  }

  addMessage(message: Message): void {
    if (!this.state.messages[message.roomId]) {
      this.state.messages[message.roomId] = [];
    }
    
    this.state.messages[message.roomId].push(message);
    
    // Update unread count if not current room
    if (message.roomId !== this.state.currentRoomId && 
        message.senderId !== this.state.currentUser?.id) {
      this.state.unreadCounts[message.roomId] = 
        (this.state.unreadCounts[message.roomId] || 0) + 1;
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  addUser(user: User): void {
    this.state.users[user.id] = user;
    this.saveToStorage();
    this.notifyListeners();
  }

  updateUserStatus(userId: string, status: User['status']): void {
    if (this.state.users[userId]) {
      this.state.users[userId].status = status;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  setConnectionStatus(connected: boolean): void {
    this.state.isConnected = connected;
    this.notifyListeners();
  }

  addTypingIndicator(indicator: TypingIndicator): void {
    // Remove existing indicator for this user in this room
    this.state.typingIndicators = this.state.typingIndicators.filter(
      i => !(i.userId === indicator.userId && i.roomId === indicator.roomId)
    );
    
    // Add new indicator
    this.state.typingIndicators.push(indicator);
    this.notifyListeners();
  }

  removeTypingIndicator(userId: string, roomId: string): void {
    this.state.typingIndicators = this.state.typingIndicators.filter(
      i => !(i.userId === userId && i.roomId === roomId)
    );
    this.notifyListeners();
  }

  clearOldTypingIndicators(): void {
    const now = new Date();
    this.state.typingIndicators = this.state.typingIndicators.filter(
      i => now.getTime() - i.timestamp.getTime() < 5000 // Remove indicators older than 5 seconds
    );
    this.notifyListeners();
  }

  getRoomMessages(roomId: string): Message[] {
    return this.state.messages[roomId] || [];
  }

  getUsersInRoom(roomId: string): User[] {
    const room = this.state.rooms[roomId];
    if (!room) return [];
    
    return room.members.map(memberId => this.state.users[memberId]).filter((user): user is User => Boolean(user));
  }

  getOnlineUsers(): User[] {
    return Object.values(this.state.users).filter(user => user.status === 'online');
  }

  createDirectMessage(otherUserId: string): string {
    const currentUserId = this.state.currentUser?.id;
    if (!currentUserId) return '';
    
    const participants: [string, string] = [currentUserId, otherUserId].sort() as [string, string];
    const dmId = `dm_${participants[0]}_${participants[1]}`;
    
    if (!this.state.directMessages[dmId]) {
      this.state.directMessages[dmId] = {
        id: dmId,
        participants,
        messages: [],
        lastActivity: new Date()
      };
      this.saveToStorage();
    }
    
    return dmId;
  }
}

export const chatStore = new ChatStore();