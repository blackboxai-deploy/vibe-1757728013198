'use client';

import { Message, TypingIndicator, User } from '@/types/chat';
import { GenerationRequest } from '@/types/ai';
import { chatStore } from './chat-store';
import { aiStore } from './ai-store';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private url: string;

  constructor() {
    this.url = '';
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}/api/websocket`;
    }
  }

  connect(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    chatStore.setConnectionStatus(false);
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      chatStore.setConnectionStatus(true);
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Send user info
      const currentUser = chatStore.getState().currentUser;
      if (currentUser) {
        this.send({
          type: 'user_connected',
          data: currentUser
        });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      chatStore.setConnectionStatus(false);
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'new_message':
        chatStore.addMessage(message.data as Message);
        break;
        
      case 'user_connected':
      case 'user_updated':
        chatStore.addUser(message.data as User);
        break;
        
      case 'user_status_changed':
        chatStore.updateUserStatus(message.data.userId, message.data.status);
        break;
        
      case 'typing_start':
        chatStore.addTypingIndicator(message.data as TypingIndicator);
        break;
        
      case 'typing_stop':
        chatStore.removeTypingIndicator(message.data.userId, message.data.roomId);
        break;
        
      case 'generation_started':
        aiStore.setCurrentGeneration(message.data as GenerationRequest);
        break;
        
      case 'generation_progress':
        aiStore.updateGenerationRequest(message.data.id, {
          progress: message.data.progress,
          status: 'processing'
        });
        break;
        
      case 'generation_completed':
        aiStore.updateGenerationRequest(message.data.id, {
          status: 'completed',
          result: message.data.result,
          completedAt: new Date()
        });
        aiStore.setCurrentGeneration(null);
        
        // Create and send message with generated content
        if (message.data.result) {
          const generatedMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            roomId: message.data.roomId,
            senderId: message.data.userId,
            content: this.formatGeneratedContent(message.data),
            type: 'ai-generated',
            timestamp: new Date(),
            readBy: [],
            metadata: {
              aiModel: message.data.modelId,
              generationTime: message.data.generationTime,
              prompt: message.data.prompt
            }
          };
          
          chatStore.addMessage(generatedMessage);
        }
        break;
        
      case 'generation_failed':
        aiStore.updateGenerationRequest(message.data.id, {
          status: 'failed',
          error: message.data.error,
          completedAt: new Date()
        });
        aiStore.setCurrentGeneration(null);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private formatGeneratedContent(data: any): string {
    switch (data.type) {
      case 'image':
        return `🎨 Generated Image: "${data.prompt}"`;
      case 'video':
        return `🎬 Generated Video: "${data.prompt}"`;
      case 'code':
        return `💻 Generated Code: "${data.prompt}"`;
      default:
        return `✨ AI Generated Content: "${data.prompt}"`;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  // Public methods for sending specific message types
  sendMessage(message: Message): void {
    this.send({
      type: 'send_message',
      data: message
    });
  }

  sendTypingStart(roomId: string): void {
    const currentUser = chatStore.getState().currentUser;
    if (currentUser) {
      this.send({
        type: 'typing_start',
        data: {
          userId: currentUser.id,
          roomId,
          timestamp: new Date()
        }
      });
    }
  }

  sendTypingStop(roomId: string): void {
    const currentUser = chatStore.getState().currentUser;
    if (currentUser) {
      this.send({
        type: 'typing_stop',
        data: {
          userId: currentUser.id,
          roomId
        }
      });
    }
  }

  updateUserStatus(status: User['status']): void {
    const currentUser = chatStore.getState().currentUser;
    if (currentUser) {
      this.send({
        type: 'update_status',
        data: {
          userId: currentUser.id,
          status
        }
      });
    }
  }

  requestGeneration(request: GenerationRequest): void {
    this.send({
      type: 'generate_ai_content',
      data: request
    });
  }
}

export const wsManager = new WebSocketManager();