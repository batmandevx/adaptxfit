import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/community - Get forum posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }
    if (userId) {
      where.userId = userId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const posts = await db.forumPost.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        replies: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const total = await db.forumPost.count({ where });

    return NextResponse.json({
      success: true,
      data: posts.map((post) => ({
        ...post,
        replyCount: post._count.replies,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

// POST /api/community - Create a forum post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      content,
      category,
      isExpert,
    } = body;

    if (!userId || !title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, content, category' },
        { status: 400 }
      );
    }

    const validCategories = ['support', 'tips', 'motivation', 'coaching'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const post = await db.forumPost.create({
      data: {
        userId,
        title,
        content,
        category,
        isExpert: isExpert ?? false,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: post,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}
