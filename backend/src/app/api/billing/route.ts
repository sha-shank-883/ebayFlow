import { NextResponse } from 'next/server';
import { BillingService } from '@/modules/billing/billing.service';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const billingService = new BillingService();
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'status') {
      const status = await billingService.getSubscriptionStatus(user.workspaceId);
      return NextResponse.json(status);
    }

    if (action === 'plans') {
      const plans = await billingService.getAvailablePlans();
      return NextResponse.json(plans);
    }

    const status = await billingService.getSubscriptionStatus(user.workspaceId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { priceId } = body;

    if (priceId) {
      const session = await billingService.createCheckoutSession(user.workspaceId, priceId);
      return NextResponse.json(session);
    }

    return NextResponse.json({ message: 'priceId required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
