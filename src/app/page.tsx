'use client';

import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { getCurrentUser } from '@/lib/auth';
import { chatStore } from '@/lib/chat-store';
import { wsManager } from '@/lib/websocket';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      setIsAuthenticated(true);
      chatStore.setCurrentUser(currentUser);
      
      // Connect to WebSocket
      wsManager.connect();
    }
    setIsLoading(false);

    // Cleanup WebSocket on unmount
    return () => {
      wsManager.disconnect();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    wsManager.disconnect();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <ChatInterface onLogout={handleLogout} />
      )}
    </>
  );
}