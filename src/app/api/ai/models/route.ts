import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'image', 'video', 'code'

    // Default models available in the system
    const models = {
      image: [
        {
          id: 'flux-pro',
          name: 'FLUX Pro',
          description: 'High-quality image generation with excellent prompt adherence',
          type: 'image',
          provider: 'Black Forest Labs',
          capabilities: {
            maxPromptLength: 500,
            supportedSizes: ['512x512', '768x768', '1024x1024', '1024x768', '768x1024']
          },
          pricing: {
            costPerGeneration: 0.05,
            currency: 'USD'
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
          },
          pricing: {
            costPerGeneration: 0.02,
            currency: 'USD'
          }
        }
      ],
      video: [
        {
          id: 'minimax-video',
          name: 'MiniMax Video',
          description: 'Generate short videos from text descriptions',
          type: 'video',
          provider: 'MiniMax',
          capabilities: {
            maxPromptLength: 200,
            maxDuration: 6,
            supportedResolutions: ['720p', '1080p']
          },
          pricing: {
            costPerGeneration: 0.25,
            currency: 'USD'
          }
        },
        {
          id: 'runway-video',
          name: 'Runway Gen-3',
          description: 'Advanced video generation with camera controls',
          type: 'video',
          provider: 'Runway',
          capabilities: {
            maxPromptLength: 300,
            maxDuration: 10,
            supportedResolutions: ['720p', '1080p', '4K']
          },
          pricing: {
            costPerGeneration: 0.50,
            currency: 'USD'
          }
        }
      ],
      code: [
        {
          id: 'claude-code',
          name: 'Claude 3.5 Sonnet',
          description: 'Advanced code generation and programming assistance',
          type: 'code',
          provider: 'Anthropic',
          capabilities: {
            maxPromptLength: 1000,
            supportedLanguages: [
              'javascript', 'typescript', 'python', 'java', 'cpp', 'rust', 
              'go', 'html', 'css', 'sql', 'php', 'ruby', 'swift', 'kotlin'
            ]
          },
          pricing: {
            costPerGeneration: 0.01,
            currency: 'USD'
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
            supportedLanguages: [
              'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 
              'php', 'ruby', 'swift', 'kotlin', 'rust', 'go', 'scala'
            ]
          },
          pricing: {
            costPerGeneration: 0.015,
            currency: 'USD'
          }
        },
        {
          id: 'codellama-code',
          name: 'CodeLlama 70B',
          description: 'Open-source code generation optimized for programming',
          type: 'code',
          provider: 'Meta',
          capabilities: {
            maxPromptLength: 600,
            supportedLanguages: [
              'python', 'javascript', 'java', 'cpp', 'c', 'bash', 'html', 'css'
            ]
          },
          pricing: {
            costPerGeneration: 0.008,
            currency: 'USD'
          }
        }
      ]
    };

    // Filter by type if specified
    if (type && ['image', 'video', 'code'].includes(type)) {
      return NextResponse.json({
        success: true,
        models: models[type as keyof typeof models],
        type
      });
    }

    // Return all models
    const allModels = [...models.image, ...models.video, ...models.code];
    
    return NextResponse.json({
      success: true,
      models: allModels,
      categories: {
        image: models.image.length,
        video: models.video.length,
        code: models.code.length
      }
    });

  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}