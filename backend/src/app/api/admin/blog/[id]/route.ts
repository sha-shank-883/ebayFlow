import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { atomicDeleteBlog, withTransaction } from '@/lib/transaction';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Updates a blog post with transactional safety.
 * Wraps the post update and audit log creation in a single transaction
 * to ensure atomicity - either both succeed or both roll back.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const body = await request.json();

    const post = await withTransaction(async (tx) => {
      const updated = await tx.blogPost.update({
        where: { id: params.id },
        data: {
          title: body.title,
          slug: body.slug,
          excerpt: body.excerpt,
          content: body.content,
          featuredImage: body.featuredImage,
          status: body.status,
          publishedAt: body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' ? new Date() : existing.publishedAt,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          metaTitle: body.metaTitle,
          metaDescription: body.metaDescription,
          isActive: body.isActive,
        },
      });

      await tx.contentAudit.create({
        data: {
          action: 'UPDATE',
          entityType: 'BlogPost',
          entityId: updated.id,
          entityName: updated.title,
          changes: { before: existing, after: updated },
        },
      });

      return updated;
    });

    return NextResponse.json(post);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Deletes a blog post atomically using transaction wrapper.
 * Uses atomicDeleteBlog to ensure the post and related audit entries
 * are all handled in a single transaction.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await atomicDeleteBlog(params.id);

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
