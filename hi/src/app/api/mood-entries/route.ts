import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/mood-entries - List mood entries with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query param: userId' },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const since = searchParams.get('since') || searchParams.get('createdAfter');

    const where: Record<string, unknown> = { userId };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    const [data, total] = await Promise.all([
      db.moodEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.moodEntry.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood entries' },
      { status: 500 }
    );
  }
}

// POST /api/mood-entries - Create a new mood entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mood, emotion, note, riskLevel } = body;

    if (mood === undefined || !emotion) {
      return NextResponse.json(
        { error: 'Missing required fields: mood (1-5), emotion' },
        { status: 400 }
      );
    }

    if (typeof mood !== 'number' || mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: 'mood must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    const validRiskLevels = ['low', 'moderate', 'high', 'crisis'];
    const safeRiskLevel = riskLevel && validRiskLevels.includes(riskLevel)
      ? riskLevel
      : 'low';

    const entry = await db.moodEntry.create({
      data: {
        userId: userId || 'default-user',
        mood,
        emotion,
        note: note ?? null,
        riskLevel: safeRiskLevel,
      },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    return NextResponse.json(
      { error: 'Failed to create mood entry' },
      { status: 500 }
    );
  }
}
