import { prisma } from '../../lib/prisma';
import { Plan } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20' as any,
});

export interface PlanLimits {
  listings: number;
  accounts: number;
  aiCredits: number;
}

export const PLAN_CONFIGS: Record<Plan, PlanLimits & { priceMonthly: number; priceYearly: number }> = {
  [Plan.STARTER]: {
    listings: 200,
    accounts: 1,
    aiCredits: 50,
    priceMonthly: 0,
    priceYearly: 0,
  },
  [Plan.GROWTH]: {
    listings: 1000,
    accounts: 3,
    aiCredits: 200,
    priceMonthly: 29,
    priceYearly: 290,
  },
  [Plan.PROFESSIONAL]: {
    listings: 5000,
    accounts: 10,
    aiCredits: 1000,
    priceMonthly: 79,
    priceYearly: 790,
  },
};

export class BillingService {
  async getWorkspacePlan(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        plan: true,
        listingsLimit: true,
        accountsLimit: true,
        aiCreditsLimit: true,
        aiCreditsUsed: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!workspace) throw new Error('Workspace not found');
    return workspace;
  }

  async getSubscriptionStatus(workspaceId: string) {
    const workspace = await this.getWorkspacePlan(workspaceId);
    const planConfig = PLAN_CONFIGS[workspace.plan];

    const listingCount = await prisma.listing.count({ where: { workspaceId } });
    const accountCount = await prisma.ebayAccount.count({ where: { workspaceId } });

    return {
      plan: workspace.plan,
      status: workspace.subscriptionStatus,
      limits: {
        listings: { used: listingCount, limit: workspace.listingsLimit },
        accounts: { used: accountCount, limit: workspace.accountsLimit },
        aiCredits: { used: workspace.aiCreditsUsed, limit: workspace.aiCreditsLimit },
      },
      currentPeriodEnd: workspace.currentPeriodEnd,
      planConfig,
    };
  }

  async createCheckoutSession(workspaceId: string, priceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: true },
          where: { role: 'OWNER' },
        },
      },
    });

    if (!workspace) throw new Error('Workspace not found');

    const owner = workspace.members[0]?.user;
    if (!owner) throw new Error('No workspace owner found');

    let customerId = workspace.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: owner.email,
        name: owner.name,
        metadata: { workspaceId },
      });
      customerId = customer.id;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing?canceled=true`,
      metadata: { workspaceId },
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new Error('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;

        if (workspaceId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;

          let plan: Plan = Plan.STARTER;
          if (priceId?.includes('growth')) plan = Plan.GROWTH;
          else if (priceId?.includes('professional')) plan = Plan.PROFESSIONAL;

          const planConfig = PLAN_CONFIGS[plan];

          await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              plan,
              subscriptionStatus: 'active',
              stripeSubscriptionId: subscription.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              listingsLimit: planConfig.listings,
              accountsLimit: planConfig.accounts,
              aiCreditsLimit: planConfig.aiCredits,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await prisma.workspace.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              aiCreditsUsed: 0,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.workspace.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: Plan.STARTER,
            subscriptionStatus: 'cancelled',
            stripeSubscriptionId: null,
          },
        });
        break;
      }
    }

    return { received: true };
  }

  async checkLimit(workspaceId: string, type: keyof PlanLimits) {
    const workspace = await this.getWorkspacePlan(workspaceId);

    switch (type) {
      case 'listings': {
        const listingCount = await prisma.listing.count({ where: { workspaceId } });
        if (listingCount >= workspace.listingsLimit) {
          throw new Error('Listing limit reached for your current plan');
        }
        break;
      }
      case 'accounts': {
        const accountCount = await prisma.ebayAccount.count({ where: { workspaceId } });
        if (accountCount >= workspace.accountsLimit) {
          throw new Error('eBay account limit reached for your current plan');
        }
        break;
      }
      case 'aiCredits': {
        if (workspace.aiCreditsUsed >= workspace.aiCreditsLimit) {
          throw new Error('AI credits exhausted for this period');
        }
        break;
      }
    }

    return true;
  }

  async incrementAiUsage(workspaceId: string, credits = 1) {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { aiCreditsUsed: { increment: credits } },
    });
  }

  async getAvailablePlans() {
    return Object.entries(PLAN_CONFIGS).map(([plan, config]) => ({
      name: plan,
      listings: config.listings,
      accounts: config.accounts,
      aiCredits: config.aiCredits,
      priceMonthly: config.priceMonthly,
      priceYearly: config.priceYearly,
    }));
  }
}
