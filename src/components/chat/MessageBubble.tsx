'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Message, User } from '@/types/chat';
import { chatStore } from '@/lib/chat-store';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  grouped?: boolean;
}

export function MessageBubble({ message, sender, grouped = false }: MessageBubbleProps) {
  const currentUser = chatStore.getState().currentUser;
  const isOwnMessage = currentUser?.id === message.senderId;
  
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'ai-generated':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                ✨ AI Generated
              </Badge>
              {message.metadata?.aiModel && (
                <Badge variant="outline" className="text-xs">
                  {message.metadata.aiModel}
                </Badge>
              )}
            </div>
            
            <p className="text-sm">{message.content}</p>
            
            {message.metadata?.prompt && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Prompt:</p>
                  <p className="text-sm italic">"{message.metadata.prompt}"</p>
                </CardContent>
              </Card>
            )}
            
            {message.type === 'ai-generated' && message.metadata?.url && (
              <div className="mt-2">
                {message.metadata.url.includes('.mp4') || message.metadata.url.includes('video') ? (
                  <video 
                    controls 
                    className="max-w-sm rounded-lg shadow-lg"
                    src={message.metadata.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img 
                    src={message.metadata.url} 
                    alt={message.metadata.prompt || 'AI Generated Image'}
                    className="max-w-sm rounded-lg shadow-lg"
                    loading="lazy"
                  />
                )}
              </div>
            )}
            
            {message.metadata?.generationTime && (
              <p className="text-xs text-muted-foreground">
                Generated in {message.metadata.generationTime}s
              </p>
            )}
          </div>
        );
        
      case 'code':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">💻 Code</Badge>
              {message.metadata?.language && (
                <Badge variant="outline" className="text-xs">
                  {message.metadata.language}
                </Badge>
              )}
            </div>
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm">
              <code>{message.content}</code>
            </pre>
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            {message.metadata?.url && (
              <img 
                src={message.metadata.url} 
                alt="Shared image"
                className="max-w-sm rounded-lg shadow-lg"
                loading="lazy"
              />
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            {message.metadata?.url && (
              <video 
                controls 
                className="max-w-sm rounded-lg shadow-lg"
                src={message.metadata.url}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );
        
      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">📎 File</Badge>
              {message.metadata?.fileName && (
                <span className="text-sm font-medium">{message.metadata.fileName}</span>
              )}
            </div>
            <p className="text-sm">{message.content}</p>
            {message.metadata?.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={message.metadata.url} download={message.metadata.fileName}>
                  Download
                </a>
              </Button>
            )}
          </div>
        );
        
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={cn(
      "flex gap-3",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {/* Avatar (only for other users and non-grouped messages) */}
      {!isOwnMessage && !grouped && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback className="text-xs">
            {sender?.username?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for grouped messages */}
      {!isOwnMessage && grouped && <div className="w-8" />}

      {/* Message content */}
      <div className={cn(
        "max-w-md space-y-1",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {/* Sender name and timestamp */}
        {!grouped && (
          <div className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isOwnMessage ? "justify-end" : "justify-start"
          )}>
            {!isOwnMessage && (
              <span className="font-medium">{sender?.username || 'Unknown'}</span>
            )}
            <span>{formatTime(message.timestamp)}</span>
            {message.edited && (
              <span className="italic">(edited)</span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}>
          {renderMessageContent()}
        </div>

        {/* Read receipts */}
        {isOwnMessage && message.readBy.length > 0 && (
          <div className="text-xs text-muted-foreground text-right">
            Read by {message.readBy.length}
          </div>
        )}
      </div>
    </div>
  );
}