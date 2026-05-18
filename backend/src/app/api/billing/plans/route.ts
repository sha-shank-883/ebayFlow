import { NextResponse } from 'next/server';
import { BillingService } from '../../../../../modules/billing/billing.service';

const billingService = new BillingService();

export async function GET() {
  try {
    const plans = await billingService.getAvailablePlans();
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
