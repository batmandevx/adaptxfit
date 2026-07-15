import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/wearable - Get heart rate logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const deviceType = searchParams.get('deviceType');
    const activity = searchParams.get('activity');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }
    if (deviceType) {
      where.deviceType = deviceType;
    }
    if (activity) {
      where.activity = activity;
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

    const heartRateLogs = await db.heartRateLog.findMany({
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

    const total = await db.heartRateLog.count({ where });

    // Compute summary stats if we have data
    let summary = null;
    if (heartRateLogs.length > 0) {
      const rates = heartRateLogs.map((log) => log.heartRate);
      const avgHR = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
      const maxHR = Math.max(...rates);
      const minHR = Math.min(...rates);

      const spO2Values = heartRateLogs
        .map((log) => log.spO2)
        .filter((v): v is number => v !== null);
      const avgSpO2 = spO2Values.length > 0
        ? Math.round(spO2Values.reduce((a, b) => a + b, 0) / spO2Values.length)
        : null;

      summary = {
        averageHeartRate: avgHR,
        maxHeartRate: maxHR,
        minHeartRate: minHR,
        averageSpO2: avgSpO2,
        totalReadings: heartRateLogs.length,
      };
    }

    return NextResponse.json({
      success: true,
      data: heartRateLogs,
      summary,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching heart rate logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch heart rate logs' },
      { status: 500 }
    );
  }
}

// POST /api/wearable - Log heart rate data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      heartRate,
      bpSystolic,
      bpDiastolic,
      spO2,
      deviceType,
      activity,
    } = body;

    if (!userId || heartRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, heartRate' },
        { status: 400 }
      );
    }

    if (heartRate < 20 || heartRate > 250) {
      return NextResponse.json(
        { success: false, error: 'heartRate must be between 20 and 250' },
        { status: 400 }
      );
    }

    const heartRateLog = await db.heartRateLog.create({
      data: {
        userId,
        heartRate,
        bpSystolic: bpSystolic ?? null,
        bpDiastolic: bpDiastolic ?? null,
        spO2: spO2 ?? null,
        deviceType: deviceType ?? null,
        activity: activity ?? null,
      },
    });

    // Determine heart rate zone
    let zone = 'unknown';
    if (heartRate < 60) zone = 'resting';
    else if (heartRate < 100) zone = 'light';
    else if (heartRate < 140) zone = 'moderate';
    else if (heartRate < 170) zone = 'vigorous';
    else zone = 'peak';

    // Check for alert conditions
    const alerts: string[] = [];
    if (heartRate > 180) {
      alerts.push('Heart rate is critically high! Consider stopping exercise.');
    } else if (heartRate > 160) {
      alerts.push('Heart rate is very high. Monitor closely.');
    }
    if (heartRate < 40) {
      alerts.push('Heart rate is unusually low. Please consult a doctor.');
    }
    if (spO2 !== undefined && spO2 < 90) {
      alerts.push('Blood oxygen is critically low! Seek medical attention.');
    } else if (spO2 !== undefined && spO2 < 95) {
      alerts.push('Blood oxygen is below normal range.');
    }

    return NextResponse.json({
      success: true,
      data: heartRateLog,
      meta: {
        zone,
        alerts: alerts.length > 0 ? alerts : undefined,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging heart rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log heart rate data' },
      { status: 500 }
    );
  }
}
