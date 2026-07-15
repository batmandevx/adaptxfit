import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// GET /api/nutrition - Get food logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }
    if (mealType) {
      where.mealType = mealType;
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

    const foodLogs = await db.foodLog.findMany({
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

    const total = await db.foodLog.count({ where });

    return NextResponse.json({
      success: true,
      data: foodLogs,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching food logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch food logs' },
      { status: 500 }
    );
  }
}

// POST /api/nutrition - Log food entry or analyze food image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // If action is "analyze", use VLM to analyze food image
    if (action === 'analyze') {
      return await analyzeFoodImage(body);
    }

    // Otherwise, log a food entry
    return await logFoodEntry(body);
  } catch (error) {
    console.error('Error in nutrition API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process nutrition request' },
      { status: 500 }
    );
  }
}

async function analyzeFoodImage(body: {
  image: string;
  userId?: string;
}) {
  const { image, userId } = body;

  if (!image) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: image (base64 string or URL)' },
      { status: 400 }
    );
  }

  try {
    const zai = await ZAI.create();

    // Determine if image is base64 or URL
    const imageUrl = image.startsWith('data:')
      ? image
      : image.startsWith('http')
        ? image
        : `data:image/jpeg;base64,${image}`;

    const response = await zai.chat.completions.createVision({
      model: 'glm-4v-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this food image. Identify the food items and estimate: calories, protein (g), carbs (g), fat (g), fiber (g). Return as JSON with keys: foodName, calories, protein, carbs, fat, fiber. Also include a "confidence" field (0-1) indicating how confident you are in the identification. Return ONLY valid JSON, no additional text.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    // Extract the analysis result
    const content = response.choices?.[0]?.message?.content || '';

    // Try to parse the JSON from the response
    let analysis;
    try {
      // Attempt to extract JSON from the response text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { rawAnalysis: content };
      }
    } catch {
      analysis = { rawAnalysis: content };
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        userId: userId || null,
      },
    });
  } catch (error) {
    console.error('Error analyzing food image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze food image' },
      { status: 500 }
    );
  }
}

async function logFoodEntry(body: {
  userId: string;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  vitamins?: string;
  imageUrl?: string;
  mealType?: string;
}) {
  const {
    userId,
    foodName,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    vitamins,
    imageUrl,
    mealType,
  } = body;

  if (!userId || !foodName || calories === undefined) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: userId, foodName, calories' },
      { status: 400 }
    );
  }

  const foodLog = await db.foodLog.create({
    data: {
      userId,
      foodName,
      calories,
      protein: protein ?? null,
      carbs: carbs ?? null,
      fat: fat ?? null,
      fiber: fiber ?? null,
      vitamins: vitamins ?? null,
      imageUrl: imageUrl ?? null,
      mealType: mealType ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    data: foodLog,
  }, { status: 201 });
}
