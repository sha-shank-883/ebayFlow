import { NextResponse } from 'next/server';
import { OrdersService } from '@/modules/orders/orders.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const ordersService = new OrdersService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const take = searchParams.get('take') || '50';
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;

  try {
    const result = await ordersService.findAll(user.workspaceId, { skip: parseInt(skip), take: parseInt(take), search, status });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const result = await ordersService.syncOrders(user.workspaceId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
