import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { atomicToggleActive } from '@/lib/transaction';

/**
 * Toggles the active state of a page atomically.
 * Uses atomicToggleActive to ensure the update and audit log
 * are handled in a single transaction.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const isActive = body.isActive;

    await atomicToggleActive('page', params.id, isActive);

    return NextResponse.json({ message: 'Page active state updated' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
