import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sleep-logs - Return sleep logs for a userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';

    const sleepLogs = await db.sleepLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    return NextResponse.json({ data: sleepLogs });
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sleep logs' },
      { status: 500 }
    );
  }
}

// POST /api/sleep-logs - Create a new sleep log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      bedTime,
      wakeTime,
      durationHrs,
      quality,
      wakeFeeling,
      interruptions,
      notes,
    } = body;

    if (!bedTime || !wakeTime || durationHrs === undefined || !quality || !wakeFeeling) {
      return NextResponse.json(
        { error: 'Missing required fields: bedTime, wakeTime, durationHrs, quality, wakeFeeling' },
        { status: 400 }
      );
    }

    const sleepLog = await db.sleepLog.create({
      data: {
        userId: userId || 'default-user',
        bedTime: new Date(bedTime),
        wakeTime: new Date(wakeTime),
        durationHrs: parseFloat(durationHrs),
        quality: parseInt(quality),
        wakeFeeling,
        interruptions: parseInt(interruptions) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: sleepLog }, { status: 201 });
  } catch (error) {
    console.error('Error creating sleep log:', error);
    return NextResponse.json(
      { error: 'Failed to create sleep log' },
      { status: 500 }
    );
  }
}
