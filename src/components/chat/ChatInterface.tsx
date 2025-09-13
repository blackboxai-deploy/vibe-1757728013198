'use client';

import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { AIGenerationPanel } from '@/components/ai/AIGenerationPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { chatStore } from '@/lib/chat-store';
import { logout } from '@/lib/auth';


interface ChatInterfaceProps {
  onLogout: () => void;
}

export function ChatInterface({ onLogout }: ChatInterfaceProps) {
  const [chatState, setChatState] = useState(chatStore.getState());
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() => {
      setChatState(chatStore.getState());
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const currentRoom = chatState.currentRoomId ? chatState.rooms[chatState.currentRoomId] : null;
  const isConnected = chatState.isConnected;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <ChatSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <ChatSidebar onRoomSelect={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    ☰
                  </Button>
                </SheetTrigger>
              </Sheet>

              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">
                  {currentRoom ? currentRoom.name : 'AI Chat'}
                </h1>
                {currentRoom?.description && (
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    • {currentRoom.description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection status */}
              <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </Badge>

              {/* AI Panel toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={showAIPanel ? 'bg-primary/20' : ''}
              >
                ✨
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="icon">
                ⚙️
              </Button>

              {/* Logout */}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                🚪
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 flex min-h-0">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {currentRoom ? (
              <>
                <MessageList roomId={currentRoom.id} />
                <MessageInput roomId={currentRoom.id} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat!</h2>
                  <p className="text-muted-foreground mb-6">
                    Select a room from the sidebar to start chatting and generating AI content.
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>🎨</span>
                      <span>Generate images with <code>/image [prompt]</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎬</span>
                      <span>Create videos with <code>/video [prompt]</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💻</span>
                      <span>Generate code with <code>/code [language]: [prompt]</code></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Generation Panel */}
          {showAIPanel && (
            <div className="w-80 border-l bg-card/30 backdrop-blur-sm">
              <AIGenerationPanel onClose={() => setShowAIPanel(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}