// backend/src/app/api/billing/subscription/route.ts
import { NextResponse } from 'next/server';
import { BillingService } from '@/modules/billing/billing.service';
import jwt from 'jsonwebtoken';

const billingService = new BillingService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

async function getWorkspaceId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };
  
  if (!decoded.workspaceId) throw new Error('No workspace selected');
  return decoded.workspaceId;
}

export async function GET(request: Request) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const subscription = await billingService.getSubscription(workspaceId);
    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch subscription' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
