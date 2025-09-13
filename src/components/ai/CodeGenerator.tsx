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

interface CodeGeneratorProps {
  userId: string;
}

export function CodeGenerator({ userId }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('claude-code');
  const [language, setLanguage] = useState('javascript');
  const [complexity, setComplexity] = useState('intermediate');

  const codeModels = aiStore.getModels('code');
  const userSettings = aiStore.getUserSettings(userId);
  const canGenerate = aiStore.canGenerate(userId, 'code');
  const currentRoom = chatStore.getState().currentRoomId;

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 
    'html', 'css', 'sql', 'php', 'ruby', 'swift', 'kotlin', 'csharp'
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            💻 Code Generator
          </CardTitle>
          <CardDescription>
            Generate code snippets and functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code-prompt">Task Description</Label>
            <Textarea
              id="code-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the code to do..."
              className="min-h-[80px]"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground">
              {prompt.length}/1000 characters
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code-complexity">Complexity</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code-model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {codeModels.map((m) => (
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

          <Button 
            disabled={!prompt.trim() || !canGenerate || !currentRoom}
            className="w-full"
          >
            Generate Code
          </Button>

          {!canGenerate && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <Badge variant="destructive">Quota Exceeded</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Daily code generation limit reached.
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            {userSettings.quotas.usedToday.code} / {userSettings.quotas.dailyCodeGenerations} code snippets used today
          </div>
        </CardContent>
      </Card>
    </div>
  );
}