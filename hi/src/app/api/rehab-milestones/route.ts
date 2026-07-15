import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rehab-milestones - Return milestones for a userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';

    const milestones = await db.rehabMilestone.findMany({
      where: { userId },
      orderBy: { dayNumber: 'asc' },
    });

    return NextResponse.json({ data: milestones });
  } catch (error) {
    console.error('Error fetching rehab milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rehab milestones' },
      { status: 500 }
    );
  }
}

// POST /api/rehab-milestones - Create a new milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, category, status, dayNumber, targetDate, notes } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required field: title' },
        { status: 400 }
      );
    }

    if (!dayNumber || typeof dayNumber !== 'number' || dayNumber < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid required field: dayNumber (positive integer)' },
        { status: 400 }
      );
    }

    const validCategories = ['assessment', 'strength', 'mobility', 'pain', 'endurance', 'milestone'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const validStatuses = ['completed', 'in-progress', 'upcoming'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const milestone = await db.rehabMilestone.create({
      data: {
        userId: userId || 'default-user',
        title: title.trim(),
        description: description || null,
        category: category || 'milestone',
        status: status || 'upcoming',
        dayNumber,
        targetDate: targetDate ? new Date(targetDate) : null,
        completedAt: status === 'completed' ? new Date() : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating rehab milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create rehab milestone' },
      { status: 500 }
    );
  }
}
