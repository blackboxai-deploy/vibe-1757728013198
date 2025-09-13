'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { chatStore } from '@/lib/chat-store';
import { wsManager } from '@/lib/websocket';
import { parseAICommand, generateRequestId, estimateGenerationTime } from '@/lib/ai-client';
import { aiStore } from '@/lib/ai-store';
import { Message } from '@/types/chat';
import { GenerationRequest } from '@/types/ai';

interface MessageInputProps {
  roomId: string;
}

export function MessageInput({ roomId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiCommand, setAiCommand] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Parse AI commands as user types
    const command = parseAICommand(message);
    setAiCommand(command);
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      wsManager.sendTypingStart(roomId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        wsManager.sendTypingStop(roomId);
      }, 2000);
    } else if (isTyping) {
      setIsTyping(false);
      wsManager.sendTypingStop(roomId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const currentUser = chatStore.getState().currentUser;
    if (!currentUser) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      wsManager.sendTypingStop(roomId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Check for AI commands
    const command = parseAICommand(trimmedMessage);
    
    if (command) {
      await handleAIGeneration(command, currentUser.id);
    } else {
      // Regular message
      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: currentUser.id,
        content: trimmedMessage,
        type: 'text',
        timestamp: new Date(),
        readBy: [currentUser.id]
      };

      // Add to local store and send via WebSocket
      chatStore.addMessage(newMessage);
      wsManager.sendMessage(newMessage);
    }

    // Clear input
    setMessage('');
    setAiCommand(null);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleAIGeneration = async (command: any, userId: string) => {
    try {
      setIsGenerating(true);

      // Check if user can generate this type
      const canGenerate = aiStore.canGenerate(userId, `${command.type}s` as any);
      if (!canGenerate) {
        // Show error message
        const errorMessage: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomId,
          senderId: 'system',
          content: `❌ Daily ${command.type} generation quota exceeded. Please try again tomorrow.`,
          type: 'text',
          timestamp: new Date(),
          readBy: []
        };
        chatStore.addMessage(errorMessage);
        return;
      }

      // Get user settings for default model
      const userSettings = aiStore.getUserSettings(userId);
      let modelId: string;
      
      switch (command.type) {
        case 'image':
          modelId = userSettings.preferences.defaultImageModel;
          break;
        case 'video':
          modelId = userSettings.preferences.defaultVideoModel;
          break;
        case 'code':
          modelId = userSettings.preferences.defaultCodeModel;
          break;
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }

      // Create generation request
      const request: GenerationRequest = {
        id: generateRequestId(),
        type: command.type,
        prompt: command.prompt,
        modelId,
        userId,
        roomId,
        parameters: {
          ...command.parameters,
          width: command.type === 'image' ? 1024 : undefined,
          height: command.type === 'image' ? 1024 : undefined,
          duration: command.type === 'video' ? userSettings.preferences.defaultVideoDuration : undefined,
        },
        status: 'pending',
        createdAt: new Date(),
        estimatedTime: estimateGenerationTime(command.type, modelId)
      };

      // Add to queue
      aiStore.addGenerationRequest(request);
      aiStore.setCurrentGeneration(request);

      // Send status message
      const statusMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: userId,
        content: `🎯 Generating ${command.type} "${command.prompt}"... (Est. ${request.estimatedTime}s)`,
        type: 'text',
        timestamp: new Date(),
        readBy: [userId]
      };
      chatStore.addMessage(statusMessage);

      // Request generation via WebSocket
      wsManager.requestGeneration(request);

      // Increment usage quota
      aiStore.incrementUsage(userId, `${command.type}s` as any);

    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: 'system',
        content: `❌ Failed to generate ${command.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'text',
        timestamp: new Date(),
        readBy: []
      };
      chatStore.addMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {/* AI Command Preview */}
      {aiCommand && (
        <Card className="mb-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-500/20">
                  ✨ AI Command Detected
                </Badge>
                <span className="text-sm font-medium">
                  {aiCommand.type === 'image' && '🎨 Image Generation'}
                  {aiCommand.type === 'video' && '🎬 Video Generation'}
                  {aiCommand.type === 'code' && '💻 Code Generation'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Prompt: "{aiCommand.prompt}"
              {aiCommand.parameters?.language && (
                <span className="ml-2">• Language: {aiCommand.parameters.language}</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Type a message... or try /image, /video, /code`}
              className="min-h-[60px] max-h-[120px] resize-none pr-16"
              disabled={isGenerating}
            />
            
            {/* Character counter */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}/1000
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!message.trim() || isGenerating}
            className="self-end"
          >
            {isGenerating ? '⏳' : '📤'}
          </Button>
        </div>

        {/* AI Command Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 AI Commands:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span><code>/image [prompt]</code> - Generate image</span>
            <span><code>/video [prompt]</code> - Generate video</span>
            <span><code>/code [lang]: [task]</code> - Generate code</span>
          </div>
        </div>
      </form>
    </div>
  );
}