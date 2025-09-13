import { GenerationRequest, AICommand } from '@/types/ai';

export class AIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';
  }

  async generateImage(request: GenerationRequest): Promise<{ url: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        modelId: request.modelId,
        parameters: request.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateVideo(request: GenerationRequest): Promise<{ url: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}/ai/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        modelId: request.modelId,
        parameters: request.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Video generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateCode(request: GenerationRequest): Promise<{ content: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}/ai/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        modelId: request.modelId,
        parameters: request.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Code generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAvailableModels(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ai/models`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return await response.json();
  }
}

export function parseAICommand(message: string): AICommand | null {
  const trimmed = message.trim();
  
  // Image command: /image [prompt]
  if (trimmed.startsWith('/image ')) {
    return {
      command: 'image',
      type: 'image',
      prompt: trimmed.slice(7).trim()
    };
  }
  
  // Video command: /video [prompt]
  if (trimmed.startsWith('/video ')) {
    return {
      command: 'video',
      type: 'video',
      prompt: trimmed.slice(7).trim()
    };
  }
  
  // Code command: /code [language]: [prompt] or /code [prompt]
  if (trimmed.startsWith('/code ')) {
    const codeContent = trimmed.slice(6).trim();
    const colonIndex = codeContent.indexOf(':');
    
    if (colonIndex > 0 && colonIndex < 20) {
      // Language specified
      const language = codeContent.slice(0, colonIndex).trim().toLowerCase();
      const prompt = codeContent.slice(colonIndex + 1).trim();
      
      return {
        command: 'code',
        type: 'code',
        prompt,
        parameters: { language }
      };
    } else {
      // No language specified
      return {
        command: 'code',
        type: 'code',
        prompt: codeContent
      };
    }
  }
  
  return null;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function estimateGenerationTime(type: 'image' | 'video' | 'code', modelId: string): number {
  // Estimated times in seconds
  const estimates = {
    image: {
      'flux-pro': 15,
      'flux-dev': 8,
      default: 12
    },
    video: {
      'minimax-video': 60,
      default: 45
    },
    code: {
      'claude-code': 5,
      'gpt-4-code': 7,
      default: 6
    }
  };

  const typeEstimates = estimates[type];
  return typeEstimates[modelId as keyof typeof typeEstimates] || typeEstimates.default;
}

export function formatGenerationError(error: any): string {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    // Common error patterns
    if (error.message.includes('rate limit')) {
      return 'Rate limit exceeded. Please try again in a few minutes.';
    }
    if (error.message.includes('quota')) {
      return 'Daily quota exceeded. Please try again tomorrow.';
    }
    if (error.message.includes('content policy')) {
      return 'Content policy violation. Please modify your prompt.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred during generation.';
}

export function validatePrompt(prompt: string, type: 'image' | 'video' | 'code', maxLength = 500): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > maxLength) {
    return { valid: false, error: `Prompt is too long (max ${maxLength} characters)` };
  }
  
  // Check for potentially inappropriate content
  const inappropriate = ['nsfw', 'explicit', 'violence', 'harmful'];
  const lowerPrompt = prompt.toLowerCase();
  
  for (const word of inappropriate) {
    if (lowerPrompt.includes(word)) {
      return { valid: false, error: 'Prompt contains inappropriate content' };
    }
  }
  
  // Type-specific validation
  if (type === 'code') {
    // Code prompts should be more specific
    if (prompt.length < 10) {
      return { valid: false, error: 'Code prompts should be more descriptive' };
    }
  }
  
  if (type === 'video') {
    // Video prompts should describe motion or scenes
    if (!lowerPrompt.match(/\b(moving|walking|running|flowing|dancing|flying|spinning|growing|changing)\b/)) {
      // This is just a suggestion, not a hard requirement
    }
  }
  
  return { valid: true };
}

export const aiClient = new AIClient();