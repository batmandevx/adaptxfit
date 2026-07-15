import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/hydration-logs - Return hydration logs for a userId (today's entries + weekly summary)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';

    // Get today's start and end
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Fetch today's entries
    const todayEntries = await db.hydrationLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });

    // Calculate total intake today
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amountMl, 0);

    // Fetch weekly data (past 7 days)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekEntries = await db.hydrationLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: weekStart,
          lt: todayEnd,
        },
      },
      orderBy: { loggedAt: 'asc' },
    });

    // Aggregate by day
    const weeklySummary: { date: string; totalMl: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEntries = weekEntries.filter(
        (e) => e.loggedAt >= dayStart && e.loggedAt < dayEnd
      );
      const totalMl = dayEntries.reduce((sum, e) => sum + e.amountMl, 0);

      weeklySummary.push({
        date: dayStart.toISOString().split('T')[0],
        totalMl,
      });
    }

    return NextResponse.json({
      data: {
        todayEntries,
        todayTotal,
        weeklySummary,
        dailyTarget: 2500,
      },
    });
  } catch (error) {
    console.error('Error fetching hydration logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hydration logs' },
      { status: 500 }
    );
  }
}

// POST /api/hydration-logs - Create a new hydration log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amountMl } = body;

    if (!amountMl || typeof amountMl !== 'number' || amountMl <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required field: amountMl (positive number)' },
        { status: 400 }
      );
    }

    const hydrationLog = await db.hydrationLog.create({
      data: {
        userId: userId || 'default-user',
        amountMl: Math.round(amountMl),
      },
    });

    return NextResponse.json({ data: hydrationLog }, { status: 201 });
  } catch (error) {
    console.error('Error creating hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to create hydration log' },
      { status: 500 }
    );
  }
}
