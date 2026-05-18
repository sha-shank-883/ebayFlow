import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await withCache(`public:blog:p${page}:l${limit}`, 300, async () => {
      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where: { status: 'PUBLISHED', isActive: true, deletedAt: null },
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where: { status: 'PUBLISHED', isActive: true, deletedAt: null } }),
      ]);

      return { posts, total, page, totalPages: Math.ceil(total / limit) };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
