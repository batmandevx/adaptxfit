import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for repeated transcriptions
const transcriptionCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio_base64 } = body;

    if (!audio_base64 || typeof audio_base64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Audio data (base64 encoded) is required' },
        { status: 400 }
      );
    }

    // Validate base64 data size (rough check)
    const sizeInBytes = Math.ceil(audio_base64.length * 0.75);
    const maxSizeMB = 25;
    if (sizeInBytes > maxSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `Audio file too large. Maximum size is ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = audio_base64.slice(-64); // Use last 64 chars as cache key
    const cached = transcriptionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        transcription: cached.text,
        wordCount: cached.text.split(/\s+/).filter(Boolean).length,
        cached: true,
      });
    }

    // Import ZAI SDK (server-side only)
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Transcribe audio using ASR
    const response = await zai.audio.asr.create({
      file_base64: audio_base64,
    });

    const transcription = response.text || '';

    // Cache the result
    if (transcription) {
      transcriptionCache.set(cacheKey, { text: transcription, timestamp: Date.now() });

      // Clean old cache entries
      if (transcriptionCache.size > 50) {
        const now = Date.now();
        for (const [key, value] of transcriptionCache) {
          if (now - value.timestamp > CACHE_TTL) {
            transcriptionCache.delete(key);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcription,
      wordCount: transcription.split(/\s+/).filter(Boolean).length,
      cached: false,
    });
  } catch (error) {
    console.error('ASR API Error:', error);

    const message = error instanceof Error ? error.message : 'Failed to transcribe audio';

    // Return user-friendly error messages
    if (message.includes('quota') || message.includes('limit')) {
      return NextResponse.json(
        { success: false, error: 'Speech recognition service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (message.includes('format') || message.includes('unsupported')) {
      return NextResponse.json(
        { success: false, error: 'Audio format not supported. Please try recording again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Could not transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
}
