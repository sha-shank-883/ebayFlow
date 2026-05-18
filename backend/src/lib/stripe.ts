// backend/src/lib/stripe.ts
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

/**
 * Stripe client instance
 */
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Latest stable
  typescript: true,
});

/**
 * Subscription plans configuration
 */
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    listingLimit: 10,
    syncFrequency: '24h',
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 2900, // £29.00
    listingLimit: 1000,
    syncFrequency: '15m',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9900, // £99.00
    listingLimit: 10000,
    syncFrequency: '5m',
  },
};

export default stripe;
