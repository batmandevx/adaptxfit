import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exercise-logs - List exercise logs with pagination and filtering
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
      db.exerciseLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.exerciseLog.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching exercise logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise logs' },
      { status: 500 }
    );
  }
}

// POST /api/exercise-logs - Create a new exercise log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, exerciseId, exerciseName, category, duration, notes } = body;

    if (!exerciseName || !category || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: exerciseName, category, duration' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'duration must be a positive number (minutes)' },
        { status: 400 }
      );
    }

    const log = await db.exerciseLog.create({
      data: {
        userId: userId || 'default-user',
        exerciseId: exerciseId || '',
        exerciseName,
        category,
        duration,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise log:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise log' },
      { status: 500 }
    );
  }
}
