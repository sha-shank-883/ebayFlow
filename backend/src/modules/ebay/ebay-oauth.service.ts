import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { encrypt } from '../../lib/encryption';
import { EbayClient } from '../../lib/ebay-client';

const EBAY_ENV = process.env.EBAY_ENVIRONMENT || 'sandbox';

const EBAY_AUTH_URLS = {
  sandbox: 'https://auth.sandbox.ebay.com/oauth2/authorize',
  production: 'https://auth.ebay.com/oauth2/authorize',
};

const EBAY_TOKEN_URLS = {
  sandbox: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
  production: 'https://api.ebay.com/identity/v1/oauth2/token',
};

export class EbayOauthService {
  getAuthorizationUrl(workspaceId: string) {
    const clientId = process.env.EBAY_CLIENT_ID;
    const redirectUri = process.env.EBAY_REDIRECT_URI || process.env.EBAY_CALLBACK_URL;
    const scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/sell.account',
    ].join(' ');

    const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');
    const authUrl = EBAY_AUTH_URLS[EBAY_ENV as keyof typeof EBAY_AUTH_URLS] || EBAY_AUTH_URLS.sandbox;

    const url = new URL(authUrl);
    url.searchParams.append('client_id', clientId!);
    url.searchParams.append('redirect_uri', redirectUri!);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scopes);
    url.searchParams.append('state', state);

    return url.toString();
  }

  async exchangeCodeForTokens(code: string, state: string) {
    let workspaceId: string;
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
      workspaceId = parsed.workspaceId;
    } catch {
      throw new Error('Invalid state parameter');
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const redirectUri = process.env.EBAY_REDIRECT_URI || process.env.EBAY_CALLBACK_URL;
    const tokenUrl = EBAY_TOKEN_URLS[EBAY_ENV as keyof typeof EBAY_TOKEN_URLS] || EBAY_TOKEN_URLS.sandbox;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri!,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in, refresh_token_expires_in, scope } = response.data;

    const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    const refreshTokenExpiresAt = refresh_token_expires_in
      ? new Date(Date.now() + refresh_token_expires_in * 1000)
      : undefined;

    const ebayClient = new EbayClient(access_token, EBAY_ENV === 'sandbox');
    const accountInfo = await ebayClient.get<any>('/sell/account/v1/account');

    await prisma.ebayAccount.upsert({
      where: {
        workspaceId_ebayUserId: {
          workspaceId: workspaceId,
          ebayUserId: accountInfo.username,
        }
      },
      update: {
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiry: accessTokenExpiresAt,
        refreshTokenExpiry: refreshTokenExpiresAt,
        username: accountInfo.username,
        feedbackScore: accountInfo.feedbackScore,
        feedbackPercent: accountInfo.feedbackPercentage,
        sellerLevel: accountInfo.sellerLevel,
        storeName: accountInfo.storeName,
        scopes: scope?.split(' ') || [],
        isSandbox: EBAY_ENV === 'sandbox',
      },
      create: {
        workspaceId: workspaceId,
        ebayUserId: accountInfo.username,
        username: accountInfo.username,
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiry: accessTokenExpiresAt,
        refreshTokenExpiry: refreshTokenExpiresAt,
        marketplace: 'EBAY_GB',
        feedbackScore: accountInfo.feedbackScore,
        feedbackPercent: accountInfo.feedbackPercentage,
        sellerLevel: accountInfo.sellerLevel,
        storeName: accountInfo.storeName,
        scopes: scope?.split(' ') || [],
        isSandbox: EBAY_ENV === 'sandbox',
      },
    });

    return { success: true };
  }
}
