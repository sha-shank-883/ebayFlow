import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'auth-url') {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:4000';
      const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const autoRedirectUri = `${proto}://${host}/api/ebay/callback`;

      const referer = request.headers.get('referer');
      const origin = request.headers.get('origin');
      let autoFrontendUrl = searchParams.get('frontendUrl') || origin || (referer ? new URL(referer).origin : undefined) || process.env.FRONTEND_URL || 'http://localhost:3000';
      autoFrontendUrl = autoFrontendUrl.replace(/\/+$/, '');

      const customClientId = searchParams.get('clientId') || undefined;
      const customClientSecret = searchParams.get('clientSecret') || undefined;
      const customEnvironment = searchParams.get('environment') || undefined;
      const customRuName = searchParams.get('ruName') || searchParams.get('redirectUri') || autoRedirectUri;

      const result = await ebayService.generateAuthUrl(user.workspaceId, {
        frontendUrl: autoFrontendUrl,
        redirectUri: customRuName,
        clientId: customClientId,
        clientSecret: customClientSecret,
        environment: customEnvironment,
      });
      return NextResponse.json(result);
    }

    if (action === 'accounts') {
      const accounts = await ebayService.getConnectedAccounts(user.workspaceId);
      return NextResponse.json(accounts);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const accountId = searchParams.get('accountId');

  try {
    if (action === 'sync' && accountId) {
      const result = await ebayService.syncListings(user.workspaceId, accountId);
      return NextResponse.json(result);
    }

    if (action === 'sync-orders' && accountId) {
      const result = await ebayService.syncOrders(user.workspaceId, accountId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
