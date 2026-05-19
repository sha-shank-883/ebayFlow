import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler(request: Request, { params }: { params: { slug: string } }) {
  try {
    const post = await withCache(`public:blog:${params.slug}`, 300, async () => {
      return await prisma.blogPost.findFirst({
        where: { slug: params.slug, status: 'PUBLISHED', isActive: true, deletedAt: null },
      });
    });

    if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
