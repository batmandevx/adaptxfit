import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/breathing-sessions - List breathing sessions with pagination and filtering
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
      db.breathingSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.breathingSession.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching breathing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breathing sessions' },
      { status: 500 }
    );
  }
}

// POST /api/breathing-sessions - Create a new breathing session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pattern, durationSec, cyclesDone } = body;

    if (!pattern || durationSec === undefined || cyclesDone === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: pattern, durationSec, cyclesDone' },
        { status: 400 }
      );
    }

    const validPatterns = ['4-7-8', 'box', 'coherent', 'energizing'];
    if (!validPatterns.includes(pattern)) {
      return NextResponse.json(
        { error: `Invalid pattern. Must be one of: ${validPatterns.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof durationSec !== 'number' || durationSec <= 0) {
      return NextResponse.json(
        { error: 'durationSec must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof cyclesDone !== 'number' || cyclesDone < 0) {
      return NextResponse.json(
        { error: 'cyclesDone must be a non-negative number' },
        { status: 400 }
      );
    }

    const session = await db.breathingSession.create({
      data: {
        userId: userId || 'default-user',
        pattern,
        durationSec,
        cyclesDone,
      },
    });

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    console.error('Error creating breathing session:', error);
    return NextResponse.json(
      { error: 'Failed to create breathing session' },
      { status: 500 }
    );
  }
}
