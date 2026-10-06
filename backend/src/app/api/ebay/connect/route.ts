import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    // Dynamic Host and Protocol Detection
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:4000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const autoRedirectUri = `${proto}://${host}/api/ebay/callback`;

    // Dynamic Frontend Detection
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    let autoFrontendUrl = searchParams.get('frontendUrl') || origin || (referer ? new URL(referer).origin : undefined) || process.env.FRONTEND_URL || 'http://localhost:3000';
    autoFrontendUrl = autoFrontendUrl.replace(/\/+$/, '');

    const customClientId = searchParams.get('clientId') || undefined;
    const customClientSecret = searchParams.get('clientSecret') || undefined;
    const customEnvironment = searchParams.get('environment') || undefined;
    const customRuName = searchParams.get('ruName') || searchParams.get('redirectUri') || autoRedirectUri;

    const result = await ebayService.generateAuthUrl(workspaceId, {
      frontendUrl: autoFrontendUrl,
      redirectUri: customRuName,
      clientId: customClientId,
      clientSecret: customClientSecret,
      environment: customEnvironment,
    });

    return NextResponse.json({
      url: result.authUrl,
      authUrl: result.authUrl,
      redirectUri: result.redirectUri,
      frontendUrl: result.frontendUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate connection URL' }, { status: 500 });
  }
}
