import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId, parameters } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!modelId || typeof modelId !== 'string') {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Simulate generation time based on model
    const generationTime = getGenerationTime(modelId);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, generationTime * 1000));

    // Create a placeholder image URL with the prompt
    const width = parameters?.width || 1024;
    const height = parameters?.height || 1024;
    const encodedPrompt = encodeURIComponent(prompt.replace(/\s+/g, '+'));
    
    const imageUrl = `https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3da762b1-a7fd-42e9-a3ea-22d8246200ac.png}x${height}?text=${encodedPrompt}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      metadata: {
        model: modelId,
        prompt: prompt,
        parameters: parameters,
        generationTime: generationTime,
        dimensions: { width, height }
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ 
      error: 'Image generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getGenerationTime(modelId: string): number {
  // Simulate different generation times for different models
  switch (modelId) {
    case 'flux-pro':
      return Math.random() * 10 + 10; // 10-20 seconds
    case 'flux-dev':
      return Math.random() * 5 + 5; // 5-10 seconds
    default:
      return Math.random() * 8 + 7; // 7-15 seconds
  }
}