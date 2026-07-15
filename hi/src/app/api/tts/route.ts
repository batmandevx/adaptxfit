import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'tongtong', speed = 1.0 } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Truncate to 1024 chars max (API limit)
    const truncatedText = text.trim().slice(0, 1024);

    // Validate speed
    const clampedSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.0));

    // Import ZAI SDK (server-side only)
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Generate TTS audio (use wav format - mp3 not supported by all models)
    const response = await zai.audio.tts.create({
      input: truncatedText,
      voice: voice,
      speed: clampedSpeed,
      response_format: 'wav',
      stream: false,
    });

    // Get audio buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Return audio as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate speech',
      },
      { status: 500 }
    );
  }
}
