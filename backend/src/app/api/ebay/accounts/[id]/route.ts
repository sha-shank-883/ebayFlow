import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId, isActive: true },
      select: {
        id: true,
        username: true,
        marketplace: true,
        storeName: true,
        feedbackScore: true,
        feedbackPercent: true,
        sellerLevel: true,
        isSandbox: true,
        activeListings: true,
        totalSales: true,
        lastSyncedAt: true,
        syncStatus: true,
        createdAt: true,
      },
    });

    if (!account) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: params.id, workspaceId: user.workspaceId },
    });

    if (!account) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    await prisma.ebayAccount.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'eBay account disconnected successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
