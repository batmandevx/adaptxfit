import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/mood - Get mood logs with optional date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const moodLogs = await db.moodLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await db.moodLog.count({ where });

    return NextResponse.json({
      success: true,
      data: moodLogs,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mood logs' },
      { status: 500 }
    );
  }
}

// POST /api/mood - Log a mood entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      mood,
      moodScore,
      productivity,
      energyLevel,
      stressLevel,
      faceExpression,
      riskLevel,
      alertSent,
      notes,
    } = body;

    if (!userId || !mood || moodScore === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, mood, moodScore' },
        { status: 400 }
      );
    }

    if (moodScore < 1 || moodScore > 10) {
      return NextResponse.json(
        { success: false, error: 'moodScore must be between 1 and 10' },
        { status: 400 }
      );
    }

    const moodLog = await db.moodLog.create({
      data: {
        userId,
        mood,
        moodScore,
        productivity: productivity ?? null,
        energyLevel: energyLevel ?? null,
        stressLevel: stressLevel ?? null,
        faceExpression: faceExpression ?? null,
        riskLevel: riskLevel ?? null,
        alertSent: alertSent ?? false,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: moodLog,
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging mood:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log mood entry' },
      { status: 500 }
    );
  }
}
