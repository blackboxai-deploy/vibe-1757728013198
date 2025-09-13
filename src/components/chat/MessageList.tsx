'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { chatStore } from '@/lib/chat-store';
import { Message, User } from '@/types/chat';

interface MessageListProps {
  roomId: string;
}

export function MessageList({ roomId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<{ [id: string]: User }>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMessages = () => {
      const chatState = chatStore.getState();
      setMessages(chatState.messages[roomId] || []);
      setUsers(chatState.users);
    };

    updateMessages();
    const unsubscribe = chatStore.subscribe(updateMessages);

    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">💭</div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">
            Be the first to send a message in this room!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-4 space-y-4">
        {messages.map((message, index) => {
          const sender = users[message.senderId];
          const previousMessage = index > 0 ? messages[index - 1] : null;
          
          // Group messages from the same sender within 5 minutes
          const shouldGroup = Boolean(previousMessage &&
            previousMessage.senderId === message.senderId &&
            message.timestamp.getTime() - previousMessage.timestamp.getTime() < 5 * 60 * 1000);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              sender={sender}
              grouped={shouldGroup}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}