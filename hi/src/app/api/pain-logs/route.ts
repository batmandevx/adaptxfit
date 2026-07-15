import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_PAIN_TYPES = ['sharp', 'dull', 'burning', 'aching', 'throbbing', 'stabbing'];
const VALID_BODY_REGIONS = ['head', 'neck', 'shoulder', 'back', 'hip', 'knee', 'ankle', 'arm', 'hand', 'foot', 'chest', 'abdomen'];

// GET /api/pain-logs - Fetch pain logs with summary stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db.painLog.findMany({
      where: {
        userId,
        loggedAt: { gte: since },
      },
      orderBy: { loggedAt: 'desc' },
    });

    // ── Summary stats ──────────────────────────────────────────────────────
    const avgPainLevel = logs.length > 0
      ? Math.round((logs.reduce((sum, l) => sum + l.painLevel, 0) / logs.length) * 10) / 10
      : 0;

    // Most common region
    const regionCounts: Record<string, number> = {};
    logs.forEach(l => { regionCounts[l.bodyRegion] = (regionCounts[l.bodyRegion] || 0) + 1; });
    const mostCommonRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Most common pain type
    const typeCounts: Record<string, number> = {};
    logs.forEach(l => { typeCounts[l.painType] = (typeCounts[l.painType] || 0) + 1; });
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Trend direction: compare first half vs second half avg pain
    let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
    if (logs.length >= 4) {
      const half = Math.floor(logs.length / 2);
      const recentHalf = logs.slice(0, half);
      const olderHalf = logs.slice(half);
      const recentAvg = recentHalf.reduce((s, l) => s + l.painLevel, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((s, l) => s + l.painLevel, 0) / olderHalf.length;
      if (recentAvg < olderAvg - 0.5) trendDirection = 'improving';
      else if (recentAvg > olderAvg + 0.5) trendDirection = 'worsening';
    }

    // ── Daily averages for chart ────────────────────────────────────────────
    const dailyMap: Record<string, { total: number; count: number }> = {};
    logs.forEach(l => {
      const day = new Date(l.loggedAt).toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { total: 0, count: 0 };
      dailyMap[day].total += l.painLevel;
      dailyMap[day].count += 1;
    });

    const dailyAverages = Object.entries(dailyMap)
      .map(([date, { total, count }]) => ({
        date,
        avgPain: Math.round((total / count) * 10) / 10,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Region heatmap data ────────────────────────────────────────────────
    const regionData: Record<string, { count: number; avgPain: number; total: number }> = {};
    logs.forEach(l => {
      if (!regionData[l.bodyRegion]) regionData[l.bodyRegion] = { count: 0, avgPain: 0, total: 0 };
      regionData[l.bodyRegion].count += 1;
      regionData[l.bodyRegion].total += l.painLevel;
    });
    Object.keys(regionData).forEach(r => {
      regionData[r].avgPain = Math.round((regionData[r].total / regionData[r].count) * 10) / 10;
    });

    // ── 7-day stats ─────────────────────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7Logs = logs.filter(l => new Date(l.loggedAt) >= sevenDaysAgo);
    const avg7Day = last7Logs.length > 0
      ? Math.round((last7Logs.reduce((s, l) => s + l.painLevel, 0) / last7Logs.length) * 10) / 10
      : 0;

    // Pain-free days (days with no logs at all or all entries pain level 1)
    const allDays = new Set<string>();
    const painDays = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      allDays.add(d.toISOString().split('T')[0]);
    }
    last7Logs.forEach(l => {
      if (l.painLevel > 1) painDays.add(new Date(l.loggedAt).toISOString().split('T')[0]);
    });
    const painFreeDays = allDays.size - painDays.size;

    // Most affected region (7 day)
    const region7: Record<string, number> = {};
    last7Logs.forEach(l => { region7[l.bodyRegion] = (region7[l.bodyRegion] || 0) + 1; });
    const mostAffectedRegion7 = Object.entries(region7).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Most common type (7 day)
    const type7: Record<string, number> = {};
    last7Logs.forEach(l => { type7[l.painType] = (type7[l.painType] || 0) + 1; });
    const mostCommonType7 = Object.entries(type7).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // 7-day trend
    let trend7: 'improving' | 'worsening' | 'stable' = 'stable';
    if (last7Logs.length >= 4) {
      const half = Math.floor(last7Logs.length / 2);
      const recent = last7Logs.slice(0, half);
      const older = last7Logs.slice(half);
      const rAvg = recent.reduce((s, l) => s + l.painLevel, 0) / recent.length;
      const oAvg = older.reduce((s, l) => s + l.painLevel, 0) / older.length;
      if (rAvg < oAvg - 0.5) trend7 = 'improving';
      else if (rAvg > oAvg + 0.5) trend7 = 'worsening';
    }

    return NextResponse.json({
      data: logs,
      summary: {
        avgPainLevel,
        mostCommonRegion,
        mostCommonType,
        trendDirection,
        avg7Day,
        mostAffectedRegion7,
        mostCommonType7,
        trend7,
        painFreeDays,
      },
      dailyAverages,
      regionData,
    });
  } catch (error) {
    console.error('Error fetching pain logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pain logs' },
      { status: 500 }
    );
  }
}

// POST /api/pain-logs - Create a new pain log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      painLevel,
      painType,
      bodyRegion,
      symptoms,
      trigger,
      reliefMeasures,
      mood,
      activityLevel,
      notes,
    } = body;

    // Validate required fields
    if (painLevel === undefined || !painType || !bodyRegion) {
      return NextResponse.json(
        { error: 'Missing required fields: painLevel (1-10), painType, bodyRegion' },
        { status: 400 }
      );
    }

    if (typeof painLevel !== 'number' || painLevel < 1 || painLevel > 10) {
      return NextResponse.json(
        { error: 'painLevel must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    if (!VALID_PAIN_TYPES.includes(painType)) {
      return NextResponse.json(
        { error: `Invalid painType. Must be one of: ${VALID_PAIN_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_BODY_REGIONS.includes(bodyRegion)) {
      return NextResponse.json(
        { error: `Invalid bodyRegion. Must be one of: ${VALID_BODY_REGIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const entry = await db.painLog.create({
      data: {
        userId: userId || 'default-user',
        painLevel,
        painType,
        bodyRegion,
        symptoms: symptoms || '',
        trigger: trigger ?? null,
        reliefMeasures: reliefMeasures ?? null,
        mood: mood ?? null,
        activityLevel: activityLevel ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating pain log:', error);
    return NextResponse.json(
      { error: 'Failed to create pain log' },
      { status: 500 }
    );
  }
}

// DELETE /api/pain-logs?id=xxx - Delete a pain log entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 }
      );
    }

    await db.painLog.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pain log:', error);
    return NextResponse.json(
      { error: 'Failed to delete pain log' },
      { status: 500 }
    );
  }
}
