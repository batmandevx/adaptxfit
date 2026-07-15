import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/achievements - List achievements with pagination and filtering
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
        where.earnedAt = { gte: sinceDate };
      }
    }

    const [data, total] = await Promise.all([
      db.achievement.findMany({
        where,
        orderBy: { earnedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.achievement.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Create a new achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, icon, category } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title' },
        { status: 400 }
      );
    }

    const validCategories = ['exercise', 'mood', 'nutrition', 'streak'];
    const safeCategory = category && validCategories.includes(category)
      ? category
      : null;

    const achievement = await db.achievement.create({
      data: {
        userId,
        title,
        description: description ?? null,
        icon: icon ?? null,
        category: safeCategory,
      },
    });

    return NextResponse.json({ data: achievement }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}
