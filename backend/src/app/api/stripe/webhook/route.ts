// backend/src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '../../../../../lib/stripe';
import { prisma } from '../../../../../lib/prisma';
import { headers } from 'next/headers';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    return NextResponse.json({ message: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  // Handle specific events
  if (event.type === 'checkout.session.completed') {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: planId,
        stripeSubscriptionId: session.subscription,
      },
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any;
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { plan: 'FREE' },
    });
  }

  return NextResponse.json({ received: true });
}
