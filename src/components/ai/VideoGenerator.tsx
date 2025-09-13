'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { aiStore } from '@/lib/ai-store';
import { chatStore } from '@/lib/chat-store';

interface VideoGeneratorProps {
  userId: string;
}

export function VideoGenerator({ userId }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('minimax-video');
  const [duration, setDuration] = useState([3]);

  const videoModels = aiStore.getModels('video');
  const userSettings = aiStore.getUserSettings(userId);
  const canGenerate = aiStore.canGenerate(userId, 'videos');
  const currentRoom = chatStore.getState().currentRoomId;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🎬 Video Generator
          </CardTitle>
          <CardDescription>
            Create short videos from text descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Prompt</Label>
            <Textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video scene you want to create..."
              className="min-h-[80px]"
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground">
              {prompt.length}/200 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {videoModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col items-start">
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration: {duration[0]} seconds</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={6}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <Button 
            disabled={!prompt.trim() || !canGenerate || !currentRoom}
            className="w-full"
          >
            Generate Video
          </Button>

          {!canGenerate && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <Badge variant="destructive">Quota Exceeded</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Daily video generation limit reached.
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            {userSettings.quotas.usedToday.videos} / {userSettings.quotas.dailyVideoGenerations} videos used today
          </div>
        </CardContent>
      </Card>
    </div>
  );
}