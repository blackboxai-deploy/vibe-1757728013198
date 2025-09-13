'use client';

import { AIState, AIModel, GenerationRequest, GenerationHistory, AISettings } from '@/types/ai';

class AIStore {
  private state: AIState;
  private listeners: Set<() => void> = new Set();
  private storageKey = 'chat-app-ai-state';

  constructor() {
    this.state = this.loadFromStorage() || this.getInitialState();
    this.initializeDefaultModels();
  }

  private getInitialState(): AIState {
    return {
      models: {},
      queue: [],
      history: {},
      settings: {},
      currentGeneration: null,
      isGenerating: false
    };
  }

  private initializeDefaultModels(): void {
    if (Object.keys(this.state.models).length === 0) {
      const defaultModels: AIModel[] = [
        {
          id: 'flux-pro',
          name: 'FLUX Pro',
          description: 'High-quality image generation with excellent prompt adherence',
          type: 'image',
          provider: 'Black Forest Labs',
          capabilities: {
            maxPromptLength: 500,
            supportedSizes: ['512x512', '768x768', '1024x1024', '1024x768', '768x1024']
          }
        },
        {
          id: 'flux-dev',
          name: 'FLUX Dev',
          description: 'Fast image generation with good quality',
          type: 'image',
          provider: 'Black Forest Labs',
          capabilities: {
            maxPromptLength: 300,
            supportedSizes: ['512x512', '768x768', '1024x1024']
          }
        },
        {
          id: 'minimax-video',
          name: 'MiniMax Video',
          description: 'Generate short videos from text descriptions',
          type: 'video',
          provider: 'MiniMax',
          capabilities: {
            maxPromptLength: 200,
            maxDuration: 6
          }
        },
        {
          id: 'claude-code',
          name: 'Claude 3.5 Sonnet',
          description: 'Advanced code generation and programming assistance',
          type: 'code',
          provider: 'Anthropic',
          capabilities: {
            maxPromptLength: 1000,
            supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 'go', 'html', 'css', 'sql']
          }
        },
        {
          id: 'gpt-4-code',
          name: 'GPT-4 Code',
          description: 'Powerful code generation with extensive language support',
          type: 'code',
          provider: 'OpenAI',
          capabilities: {
            maxPromptLength: 800,
            supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin']
          }
        }
      ];

      defaultModels.forEach(model => {
        this.state.models[model.id] = model;
      });

      this.saveToStorage();
    }
  }

  private loadFromStorage(): AIState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      state.queue.forEach((request: any) => {
        request.createdAt = new Date(request.createdAt);
        if (request.completedAt) request.completedAt = new Date(request.completedAt);
      });
      
      Object.values(state.history).forEach((history: any) => {
        history.requests.forEach((request: any) => {
          request.createdAt = new Date(request.createdAt);
          if (request.completedAt) request.completedAt = new Date(request.completedAt);
        });
      });
      
      return state;
    } catch (error) {
      console.error('Failed to load AI state from storage:', error);
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save AI state to storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Public methods
  getState(): AIState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getModels(type?: 'image' | 'video' | 'code'): AIModel[] {
    const models = Object.values(this.state.models);
    return type ? models.filter((model: AIModel) => model.type === type) : models;
  }

  getModel(id: string): AIModel | null {
    return this.state.models[id] || null;
  }

  addGenerationRequest(request: GenerationRequest): void {
    this.state.queue.push(request);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateGenerationRequest(id: string, updates: Partial<GenerationRequest>): void {
    const request = this.state.queue.find(r => r.id === id);
    if (request) {
      Object.assign(request, updates);
      
      // If completed, move to history
      if (updates.status === 'completed' || updates.status === 'failed') {
        this.moveToHistory(request);
      }
      
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  private moveToHistory(request: GenerationRequest): void {
    // Remove from queue
    this.state.queue = this.state.queue.filter(r => r.id !== request.id);
    
    // Add to user's history
    if (!this.state.history[request.userId]) {
      this.state.history[request.userId] = {
        id: request.userId,
        userId: request.userId,
        requests: [],
        favorites: [],
        templates: []
      };
    }
    
    this.state.history[request.userId].requests.unshift(request);
    
    // Keep only last 50 generations per user
    if (this.state.history[request.userId].requests.length > 50) {
      this.state.history[request.userId].requests = 
        this.state.history[request.userId].requests.slice(0, 50);
    }
  }

  setCurrentGeneration(request: GenerationRequest | null): void {
    this.state.currentGeneration = request;
    this.state.isGenerating = request !== null;
    this.notifyListeners();
  }

  getUserHistory(userId: string): GenerationHistory | null {
    return this.state.history[userId] || null;
  }

  getUserSettings(userId: string): AISettings {
    if (!this.state.settings[userId]) {
      this.state.settings[userId] = this.getDefaultSettings(userId);
      this.saveToStorage();
    }
    return this.state.settings[userId];
  }

  updateUserSettings(userId: string, settings: Partial<AISettings['preferences']>): void {
    const userSettings = this.getUserSettings(userId);
    userSettings.preferences = { ...userSettings.preferences, ...settings };
    this.saveToStorage();
    this.notifyListeners();
  }

  private getDefaultSettings(userId: string): AISettings {
    return {
      userId,
      preferences: {
        defaultImageModel: 'flux-pro',
        defaultVideoModel: 'minimax-video',
        defaultCodeModel: 'claude-code',
        defaultImageSize: '1024x1024',
        defaultVideoDuration: 3,
        autoSendGenerations: false,
        showGenerationProgress: true,
        saveToHistory: true
      },
      quotas: {
        dailyImageGenerations: 20,
        dailyVideoGenerations: 5,
        dailyCodeGenerations: 30,
        usedToday: {
          images: 0,
          videos: 0,
          code: 0
        }
      }
    };
  }

  incrementUsage(userId: string, type: 'images' | 'videos' | 'code'): void {
    const settings = this.getUserSettings(userId);
    settings.quotas.usedToday[type]++;
    this.saveToStorage();
    this.notifyListeners();
  }

  canGenerate(userId: string, type: 'images' | 'videos' | 'code'): boolean {
    const settings = this.getUserSettings(userId);
    const used = settings.quotas.usedToday[type];
    
    switch (type) {
      case 'images':
        return used < settings.quotas.dailyImageGenerations;
      case 'videos':
        return used < settings.quotas.dailyVideoGenerations;
      case 'code':
        return used < settings.quotas.dailyCodeGenerations;
      default:
        return false;
    }
  }

  addToFavorites(userId: string, generationId: string): void {
    const history = this.getUserHistory(userId);
    if (history && !history.favorites.includes(generationId)) {
      history.favorites.push(generationId);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  removeFromFavorites(userId: string, generationId: string): void {
    const history = this.getUserHistory(userId);
    if (history) {
      history.favorites = history.favorites.filter(id => id !== generationId);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  saveAsTemplate(userId: string, name: string, prompt: string, type: 'image' | 'video' | 'code', parameters: any): void {
    const history = this.getUserHistory(userId);
    if (!history) return;
    
    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      prompt,
      type,
      parameters
    };
    
    history.templates.push(template);
    this.saveToStorage();
    this.notifyListeners();
  }

  getQueuePosition(requestId: string): number {
    const index = this.state.queue.findIndex(r => r.id === requestId);
    return index === -1 ? -1 : index + 1;
  }
}

export const aiStore = new AIStore();