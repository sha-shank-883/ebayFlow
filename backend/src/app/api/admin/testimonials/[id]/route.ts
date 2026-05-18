import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';
import { createAuditLog } from '../_audit';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: {
        quote: body.quote,
        author: body.author,
        role: body.role,
        company: body.company,
        avatarUrl: body.avatarUrl,
        rating: body.rating,
        stats: body.stats,
        order: body.order,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await prisma.testimonial.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Testimonial deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
