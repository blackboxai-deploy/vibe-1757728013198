'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUser, isUsernameAvailable } from '@/lib/auth';
import { chatStore } from '@/lib/chat-store';
import { wsManager } from '@/lib/websocket';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate username
      const trimmedUsername = username.trim();
      
      if (!trimmedUsername) {
        setError('Username is required');
        return;
      }

      if (trimmedUsername.length < 2) {
        setError('Username must be at least 2 characters long');
        return;
      }

      if (trimmedUsername.length > 20) {
        setError('Username must be less than 20 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        setError('Username can only contain letters, numbers, underscores, and dashes');
        return;
      }

      if (!isUsernameAvailable(trimmedUsername)) {
        setError('Username is already taken');
        return;
      }

      // Create user
      const user = createUser(trimmedUsername);
      chatStore.setCurrentUser(user);
      
      // Connect to WebSocket
      wsManager.connect();
      
      // Call onLogin callback
      onLogin();
      
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to AI Chat</CardTitle>
          <CardDescription>
            Enter your username to join the conversation and start generating AI content
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                maxLength={20}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                2-20 characters, letters, numbers, underscores, and dashes only
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? 'Creating Account...' : 'Join Chat'}
            </Button>
          </CardFooter>
        </form>
        
        <div className="p-6 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">✨ AI Features Available:</p>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <span>🎨 Generate images with /image</span>
              <span>🎬 Create videos with /video</span>
              <span>💻 Generate code with /code</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}