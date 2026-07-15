import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exercises - List exercise logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId') || 'default-user';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { userId };

    if (category) {
      where.category = category;
    }

    const exercises = await db.exerciseLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.exerciseLog.count({ where });

    return NextResponse.json({
      success: true,
      data: exercises,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

// POST /api/exercises - Log an exercise session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      exerciseId,
      exerciseName,
      category,
      duration,
      notes,
    } = body;

    if (!exerciseName || !category || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: exerciseName, category, duration' },
        { status: 400 }
      );
    }

    const exercise = await db.exerciseLog.create({
      data: {
        userId: userId || 'default-user',
        exerciseId: exerciseId || '',
        exerciseName,
        category,
        duration,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: exercise,
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging exercise:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log exercise' },
      { status: 500 }
    );
  }
}
