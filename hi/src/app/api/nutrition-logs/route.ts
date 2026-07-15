import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/nutrition-logs - List nutrition logs with pagination and filtering
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
      db.nutritionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.nutritionLog.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition logs' },
      { status: 500 }
    );
  }
}

// POST /api/nutrition-logs - Create a new nutrition log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, foodName, calories, protein, carbs, fat, mealType } = body;

    if (!foodName || calories === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: foodName, calories' },
        { status: 400 }
      );
    }

    if (typeof calories !== 'number' || calories < 0) {
      return NextResponse.json(
        { error: 'calories must be a non-negative number' },
        { status: 400 }
      );
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const safeMealType = mealType && validMealTypes.includes(mealType)
      ? mealType
      : 'snack';

    const log = await db.nutritionLog.create({
      data: {
        userId: userId || 'default-user',
        foodName,
        calories,
        protein: protein ?? 0,
        carbs: carbs ?? 0,
        fat: fat ?? 0,
        mealType: safeMealType,
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error('Error creating nutrition log:', error);
    return NextResponse.json(
      { error: 'Failed to create nutrition log' },
      { status: 500 }
    );
  }
}
