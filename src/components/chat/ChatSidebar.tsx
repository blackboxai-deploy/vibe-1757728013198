'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatStore } from '@/lib/chat-store';
import { ChatState, User, ChatRoom } from '@/types/chat';

interface ChatSidebarProps {
  onRoomSelect?: () => void;
}

export function ChatSidebar({ onRoomSelect }: ChatSidebarProps) {
  const [chatState, setChatState] = useState<ChatState>(chatStore.getState());

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() => {
      setChatState(chatStore.getState());
    });

    // Clean up old typing indicators periodically
    const interval = setInterval(() => {
      chatStore.clearOldTypingIndicators();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRoomSelect = (roomId: string) => {
    chatStore.setCurrentRoom(roomId);
    onRoomSelect?.();
  };

  const handleUserSelect = (userId: string) => {
    if (userId === chatState.currentUser?.id) return;
    
    const dmId = chatStore.createDirectMessage(userId);
    chatStore.setCurrentDM(dmId);
    onRoomSelect?.();
  };

  const getTypingUsers = (roomId: string): User[] => {
    const typingUserIds = chatState.typingIndicators
      .filter(indicator => indicator.roomId === roomId)
      .map(indicator => indicator.userId)
      .filter(userId => userId !== chatState.currentUser?.id);
    
    return typingUserIds.map(id => chatState.users[id]).filter(Boolean);
  };

  const onlineUsers = Object.values(chatState.users).filter(
    (user: User) => user.status === 'online' && user.id !== chatState.currentUser?.id
  );

  const awayUsers = Object.values(chatState.users).filter(
    (user: User) => user.status === 'away' && user.id !== chatState.currentUser?.id
  );

  return (
    <div className="w-80 h-full bg-card border-r flex flex-col">
      {/* Current User */}
      <div className="p-4 border-b">
        {chatState.currentUser && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={chatState.currentUser.avatar} />
              <AvatarFallback>
                {chatState.currentUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{chatState.currentUser.username}</h3>
              <p className="text-sm text-green-500">● Online</p>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Chat Rooms */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Chat Rooms
            </h4>
            <div className="space-y-1">
              {Object.values(chatState.rooms).map((room: ChatRoom) => {
                const isActive = chatState.currentRoomId === room.id;
                const unreadCount = chatState.unreadCounts[room.id] || 0;
                const typingUsers = getTypingUsers(room.id);

                return (
                  <Button
                    key={room.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleRoomSelect(room.id)}
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium"># {room.name}</span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {room.description}
                        </p>
                      )}
                      {typingUsers.length > 0 && (
                        <p className="text-xs text-green-500 mt-1">
                          {typingUsers.length === 1
                            ? `${typingUsers[0].username} is typing...`
                            : `${typingUsers.length} people are typing...`}
                        </p>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Online ({onlineUsers.length})
              </h4>
              <div className="space-y-1">
                {onlineUsers.map((user: User) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-sm">{user.username}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Away Users */}
          {awayUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Away ({awayUsers.length})
              </h4>
              <div className="space-y-1">
                {awayUsers.map((user: User) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-sm">{user.username}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Away</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}