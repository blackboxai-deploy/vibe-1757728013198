'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiStore } from '@/lib/ai-store';
import { GenerationRequest } from '@/types/ai';

interface GenerationQueueProps {
  userId: string;
}

export function GenerationQueue({ userId }: GenerationQueueProps) {
  const [queue, setQueue] = useState<GenerationRequest[]>([]);
  const [history, setHistory] = useState<GenerationRequest[]>([]);

  useEffect(() => {
    const updateQueue = () => {
      const aiState = aiStore.getState();
      const userQueue = aiState.queue.filter(req => req.userId === userId);
      const userHistory = aiStore.getUserHistory(userId);
      
      setQueue(userQueue);
      setHistory(userHistory?.requests.slice(0, 10) || []); // Last 10
    };

    updateQueue();
    const unsubscribe = aiStore.subscribe(updateQueue);

    return unsubscribe;
  }, [userId]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🎨';
      case 'video': return '🎬';
      case 'code': return '💻';
      default: return '✨';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700';
      case 'processing': return 'bg-blue-500/20 text-blue-700';
      case 'completed': return 'bg-green-500/20 text-green-700';
      case 'failed': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Queue */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📋 Current Queue
            </CardTitle>
            <CardDescription>
              Your pending and active generations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {queue.map((request, index) => (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(request.type)}</span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(request.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-2">
                      "{request.prompt}"
                    </p>
                    
                    {request.status === 'processing' && (
                      <Progress value={request.progress || 0} className="mb-2" />
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Model: {request.modelId}</span>
                      {request.estimatedTime && (
                        <span>Est: {request.estimatedTime}s</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📚 Recent History
          </CardTitle>
          <CardDescription>
            Your last 10 generations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-2xl mb-2">🎯</div>
              <p>No generations yet</p>
              <p className="text-xs">Start creating with AI!</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {history.map((request) => (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(request.type)}</span>
                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(request.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-2">
                      "{request.prompt}"
                    </p>
                    
                    {request.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                        {request.error}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Model: {request.modelId}
                      </span>
                      
                      {request.status === 'completed' && request.result && (
                        <div className="flex gap-1">
                          {request.result.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => window.open(request.result?.url, '_blank')}
                            >
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                              // Copy to clipboard or regenerate
                              navigator.clipboard.writeText(request.prompt);
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}