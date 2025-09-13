export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'image' | 'video' | 'code';
  provider: string;
  capabilities: {
    maxPromptLength?: number;
    supportedSizes?: string[];
    supportedLanguages?: string[];
    maxDuration?: number; // for videos in seconds
  };
  pricing?: {
    costPerGeneration: number;
    currency: string;
  };
}

export interface GenerationRequest {
  id: string;
  type: 'image' | 'video' | 'code';
  prompt: string;
  modelId: string;
  userId: string;
  roomId: string;
  parameters: {
    // Image parameters
    width?: number;
    height?: number;
    style?: string;
    
    // Video parameters
    duration?: number;
    fps?: number;
    
    // Code parameters
    language?: string;
    framework?: string;
    complexity?: 'simple' | 'intermediate' | 'advanced';
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: {
    url?: string;
    content?: string; // for code
    metadata?: any;
  };
  error?: string;
  estimatedTime?: number; // in seconds
  progress?: number; // 0-100
}

export interface GenerationHistory {
  id: string;
  userId: string;
  requests: GenerationRequest[];
  favorites: string[]; // generation IDs
  templates: {
    id: string;
    name: string;
    prompt: string;
    type: 'image' | 'video' | 'code';
    parameters: any;
  }[];
}

export interface AISettings {
  userId: string;
  preferences: {
    defaultImageModel: string;
    defaultVideoModel: string;
    defaultCodeModel: string;
    defaultImageSize: string;
    defaultVideoDuration: number;
    autoSendGenerations: boolean;
    showGenerationProgress: boolean;
    saveToHistory: boolean;
  };
  quotas: {
    dailyImageGenerations: number;
    dailyVideoGenerations: number;
    dailyCodeGenerations: number;
    usedToday: {
      images: number;
      videos: number;
      code: number;
    };
  };
}

export interface AICommand {
  command: string;
  type: 'image' | 'video' | 'code';
  prompt: string;
  parameters?: any;
}

export interface AIState {
  models: { [id: string]: AIModel };
  queue: GenerationRequest[];
  history: { [userId: string]: GenerationHistory };
  settings: { [userId: string]: AISettings };
  currentGeneration: GenerationRequest | null;
  isGenerating: boolean;
}