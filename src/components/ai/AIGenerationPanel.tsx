'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGenerator } from './ImageGenerator';
import { VideoGenerator } from './VideoGenerator';
import { CodeGenerator } from './CodeGenerator';
import { GenerationQueue } from './GenerationQueue';
import { aiStore } from '@/lib/ai-store';
import { chatStore } from '@/lib/chat-store';
import { AIState } from '@/types/ai';

interface AIGenerationPanelProps {
  onClose: () => void;
}

export function AIGenerationPanel({ onClose }: AIGenerationPanelProps) {
  const [aiState, setAiState] = useState<AIState>(aiStore.getState());
  const [currentUser, setCurrentUser] = useState(chatStore.getState().currentUser);
  const [activeTab, setActiveTab] = useState('image');

  useEffect(() => {
    const unsubscribeAI = aiStore.subscribe(() => {
      setAiState(aiStore.getState());
    });

    const unsubscribeChat = chatStore.subscribe(() => {
      setCurrentUser(chatStore.getState().currentUser);
    });

    return () => {
      unsubscribeAI();
      unsubscribeChat();
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-muted-foreground">Please log in to use AI features</p>
      </div>
    );
  }

  const userSettings = aiStore.getUserSettings(currentUser.id);
  const currentGeneration = aiState.currentGeneration;
  const queueLength = aiState.queue.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            ✨ AI Studio
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate images, videos, and code with AI
        </p>
      </div>

      {/* Current Generation Status */}
      {currentGeneration && (
        <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-purple-500/20">
                  🔄 Generating {currentGeneration.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentGeneration.progress || 0}%
                </span>
              </div>
              
              <Progress 
                value={currentGeneration.progress || 0} 
                className="mb-2"
              />
              
              <p className="text-sm font-medium mb-1">
                "{currentGeneration.prompt}"
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Model: {currentGeneration.modelId}</span>
                <span>Est: {currentGeneration.estimatedTime}s</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Status */}
      {queueLength > 0 && !currentGeneration && (
        <div className="p-4 border-b">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Generation Queue</p>
                  <p className="text-xs text-muted-foreground">
                    {queueLength} item{queueLength !== 1 ? 's' : ''} waiting
                  </p>
                </div>
                <Badge variant="outline">
                  #{queueLength}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="image" className="text-xs">
                🎨 Images
              </TabsTrigger>
              <TabsTrigger value="video" className="text-xs">
                🎬 Videos
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                💻 Code
              </TabsTrigger>
              <TabsTrigger value="queue" className="text-xs">
                📋 Queue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image">
              <ImageGenerator userId={currentUser.id} />
            </TabsContent>

            <TabsContent value="video">
              <VideoGenerator userId={currentUser.id} />
            </TabsContent>

            <TabsContent value="code">
              <CodeGenerator userId={currentUser.id} />
            </TabsContent>

            <TabsContent value="queue">
              <GenerationQueue userId={currentUser.id} />
            </TabsContent>
          </Tabs>

          {/* Usage Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Daily Usage</CardTitle>
              <CardDescription className="text-xs">
                Your AI generation quotas for today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>🎨 Images</span>
                  <span className="text-muted-foreground">
                    {userSettings.quotas.usedToday.images} / {userSettings.quotas.dailyImageGenerations}
                  </span>
                </div>
                <Progress 
                  value={(userSettings.quotas.usedToday.images / userSettings.quotas.dailyImageGenerations) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>🎬 Videos</span>
                  <span className="text-muted-foreground">
                    {userSettings.quotas.usedToday.videos} / {userSettings.quotas.dailyVideoGenerations}
                  </span>
                </div>
                <Progress 
                  value={(userSettings.quotas.usedToday.videos / userSettings.quotas.dailyVideoGenerations) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>💻 Code</span>
                  <span className="text-muted-foreground">
                    {userSettings.quotas.usedToday.code} / {userSettings.quotas.dailyCodeGenerations}
                  </span>
                </div>
                <Progress 
                  value={(userSettings.quotas.usedToday.code / userSettings.quotas.dailyCodeGenerations) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}