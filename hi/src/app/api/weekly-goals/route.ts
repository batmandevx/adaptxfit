import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/weekly-goals - List weekly goals for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';

    const goals = await db.weeklyGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('Error fetching weekly goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly goals' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-goals - Create or update a weekly goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, category, title, targetValue, currentValue, weekStart, weekEnd } = body;

    // Update existing goal
    if (id) {
      const updateData: Record<string, unknown> = {};
      if (currentValue !== undefined) updateData.currentValue = currentValue;
      if (title !== undefined) updateData.title = title;
      if (targetValue !== undefined) updateData.targetValue = targetValue;
      if (category !== undefined) updateData.category = category;

      // Auto-complete if current >= target
      if (currentValue !== undefined && targetValue !== undefined && currentValue >= targetValue) {
        updateData.completed = true;
      }

      const updated = await db.weeklyGoal.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ data: updated });
    }

    // Create new goal
    if (!category || !title || !targetValue) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, targetValue' },
        { status: 400 }
      );
    }

    const now = new Date();
    const weekStartDate = weekStart ? new Date(weekStart) : getWeekStart(now);
    const weekEndDate = weekEnd ? new Date(weekEnd) : getWeekEnd(now);

    const goal = await db.weeklyGoal.create({
      data: {
        userId: userId || 'default-user',
        category,
        title,
        targetValue,
        currentValue: currentValue ?? 0,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        completed: false,
      },
    });

    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating weekly goal:', error);
    return NextResponse.json(
      { error: 'Failed to create/update weekly goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/weekly-goals - Delete a weekly goal
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

    await db.weeklyGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weekly goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete weekly goal' },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
