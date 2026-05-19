import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();

const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${FRONTEND_URL}/settings?error=ebay_auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${FRONTEND_URL}/settings?error=ebay_auth_failed`);
  }

  try {
    await ebayService.handleCallback(code, state);
    return NextResponse.redirect(`${FRONTEND_URL}/settings?success=true`);
  } catch (error) {
    console.error('eBay OAuth error:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/settings?error=ebay_auth_failed`);
  }
}
