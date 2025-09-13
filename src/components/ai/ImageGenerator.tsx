'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { aiStore } from '@/lib/ai-store';
import { chatStore } from '@/lib/chat-store';
import { wsManager } from '@/lib/websocket';
import { generateRequestId, estimateGenerationTime, validatePrompt } from '@/lib/ai-client';
import { GenerationRequest } from '@/types/ai';

interface ImageGeneratorProps {
  userId: string;
}

export function ImageGenerator({ userId }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-pro');
  const [size, setSize] = useState('1024x1024');
  const [style, setStyle] = useState('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const imageModels = aiStore.getModels('image');
  const userSettings = aiStore.getUserSettings(userId);
  const canGenerate = aiStore.canGenerate(userId, 'images');
  const currentRoom = chatStore.getState().currentRoomId;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!currentRoom) {
      setError('Please select a chat room first');
      return;
    }

    const validation = validatePrompt(prompt, 'image', 500);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    if (!canGenerate) {
      setError('Daily image generation quota exceeded');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const [width, height] = size.split('x').map(Number);
      
      const request: GenerationRequest = {
        id: generateRequestId(),
        type: 'image',
        prompt: prompt.trim(),
        modelId: model,
        userId,
        roomId: currentRoom,
        parameters: {
          width,
          height,
          style: style !== 'default' ? style : undefined
        },
        status: 'pending',
        createdAt: new Date(),
        estimatedTime: estimateGenerationTime('image', model)
      };

      // Add to queue and set as current
      aiStore.addGenerationRequest(request);
      aiStore.setCurrentGeneration(request);

      // Request generation via WebSocket
      wsManager.requestGeneration(request);

      // Increment usage
      aiStore.incrementUsage(userId, 'images');

      // Clear form
      setPrompt('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🎨 Image Generator
          </CardTitle>
          <CardDescription>
            Generate stunning images from text descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="image-prompt">Prompt</Label>
            <Textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="min-h-[80px]"
              maxLength={500}
              disabled={isGenerating}
            />
            <div className="text-xs text-muted-foreground">
              {prompt.length}/500 characters
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="image-model">AI Model</Label>
            <Select value={model} onValueChange={setModel} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((m) => (
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

          {/* Size Selection */}
          <div className="space-y-2">
            <Label htmlFor="image-size">Size</Label>
            <Select value={size} onValueChange={setSize} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512x512">512×512 (Square)</SelectItem>
                <SelectItem value="768x768">768×768 (Square)</SelectItem>
                <SelectItem value="1024x1024">1024×1024 (Square)</SelectItem>
                <SelectItem value="1024x768">1024×768 (Landscape)</SelectItem>
                <SelectItem value="768x1024">768×1024 (Portrait)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label htmlFor="image-style">Style</Label>
            <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="photorealistic">Photorealistic</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="oil-painting">Oil Painting</SelectItem>
                <SelectItem value="watercolor">Watercolor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !canGenerate || !currentRoom}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </Button>

          {/* Quota Warning */}
          {!canGenerate && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <Badge variant="destructive">Quota Exceeded</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                You've reached your daily image generation limit.
              </p>
            </div>
          )}

          {/* Usage Info */}
          <div className="text-xs text-muted-foreground text-center">
            {userSettings.quotas.usedToday.images} / {userSettings.quotas.dailyImageGenerations} images used today
          </div>
        </CardContent>
      </Card>
    </div>
  );
}