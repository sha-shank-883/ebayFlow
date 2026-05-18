import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { sanitizeObject, validateSlug } from '@/lib/sanitize';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const sanitizedBody = sanitizeObject(await request.json()) as Record<string, unknown>;
    const body = sanitizedBody as { title?: string; slug?: string; excerpt?: string; content?: string; featuredImage?: string | null; status?: string; scheduledAt?: string; metaTitle?: string; metaDescription?: string };
    if (body.slug && !validateSlug(body.slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || '',
        content: body.content || '',
        featuredImage: body.featuredImage || null,
        authorId: admin.id,
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        metaTitle: body.metaTitle || body.title,
        metaDescription: body.metaDescription || body.excerpt,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'BlogPost',
      entityId: post.id,
      entityName: post.title,
      changes: { after: post },
    });

    try { await invalidateCache('public:blog:*'); } catch {}

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
