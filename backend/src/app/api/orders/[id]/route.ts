import { NextResponse } from 'next/server';
import { OrdersService } from '@/modules/orders/orders.service';
import { getAuthenticatedUser, unauthorized } from '@/app/api/_auth';

const ordersService = new OrdersService();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const order = await ordersService.findOne(params.id, user.workspaceId);
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const order = await ordersService.updateStatus(params.id, user.workspaceId, body.status);
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
