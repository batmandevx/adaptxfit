import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/workout-plans - Fetch workout plans for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    const plans = await db.workoutPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse exercises JSON for each plan
    const plansWithExercises = plans.map((plan) => ({
      ...plan,
      exercises: JSON.parse(plan.exercises),
    }));

    // Get counts
    const total = await db.workoutPlan.count({ where: { userId } });
    const active = await db.workoutPlan.count({ where: { userId, status: 'active' } });
    const completed = await db.workoutPlan.count({ where: { userId, status: 'completed' } });
    const draft = await db.workoutPlan.count({ where: { userId, status: 'draft' } });

    return NextResponse.json({
      success: true,
      data: plansWithExercises,
      counts: { total, active, completed, draft },
    });
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workout plans' },
      { status: 500 }
    );
  }
}

// POST /api/workout-plans - Create a new workout plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      difficulty,
      category,
      duration,
      exercises,
      status,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Plan name is required' },
        { status: 400 }
      );
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty. Must be: beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    const validCategories = ['strength', 'flexibility', 'cardio', 'rehabilitation', 'balance'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category. Must be: strength, flexibility, cardio, rehabilitation, or balance' },
        { status: 400 }
      );
    }

    // Validate exercises
    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one exercise is required' },
        { status: 400 }
      );
    }

    for (const exercise of exercises) {
      if (!exercise.id || !exercise.name) {
        return NextResponse.json(
          { success: false, error: 'Each exercise must have id and name' },
          { status: 400 }
        );
      }
      if (typeof exercise.sets !== 'number' || exercise.sets < 1) {
        return NextResponse.json(
          { success: false, error: `Exercise "${exercise.name}" must have at least 1 set` },
          { status: 400 }
        );
      }
      if (typeof exercise.reps !== 'number' || exercise.reps < 1) {
        return NextResponse.json(
          { success: false, error: `Exercise "${exercise.name}" must have at least 1 rep` },
          { status: 400 }
        );
      }
    }

    const plan = await db.workoutPlan.create({
      data: {
        userId: userId || 'default-user',
        name: name.trim(),
        description: description || null,
        difficulty: difficulty || 'beginner',
        category,
        duration: duration || 0,
        exercises: JSON.stringify(exercises),
        status: status || 'draft',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        exercises: JSON.parse(plan.exercises),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating workout plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workout plan' },
      { status: 500 }
    );
  }
}

// PUT /api/workout-plans - Update a workout plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, difficulty, category, duration, exercises, status, scheduledAt } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workout plan ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.workoutPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Workout plan not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (category !== undefined) updateData.category = category;
    if (duration !== undefined) updateData.duration = duration;
    if (exercises !== undefined) {
      if (!Array.isArray(exercises)) {
        return NextResponse.json(
          { success: false, error: 'Exercises must be an array' },
          { status: 400 }
        );
      }
      updateData.exercises = JSON.stringify(exercises);
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      if (status === 'scheduled' && scheduledAt) {
        updateData.scheduledAt = new Date(scheduledAt);
      }
    }

    const plan = await db.workoutPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        exercises: JSON.parse(plan.exercises),
      },
    });
  } catch (error) {
    console.error('Error updating workout plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workout plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/workout-plans - Delete a workout plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workout plan ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.workoutPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Workout plan not found' },
        { status: 404 }
      );
    }

    await db.workoutPlan.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Workout plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workout plan' },
      { status: 500 }
    );
  }
}
