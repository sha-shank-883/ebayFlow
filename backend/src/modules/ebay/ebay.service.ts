import { prisma } from '../../lib/prisma';
import { encrypt, decrypt } from '../../lib/encryption';
import { EbayClient } from '../../lib/ebay-client';
import { ConfigService } from '@nestjs/config';

export interface DynamicEbayAuthOptions {
  redirectUri?: string;
  frontendUrl?: string;
  clientId?: string;
  clientSecret?: string;
  environment?: 'production' | 'sandbox' | string;
  ruName?: string;
}

const getConfig = (options?: DynamicEbayAuthOptions) => {
  const envRaw = options?.environment || process.env.EBAY_ENVIRONMENT;
  const isProd = envRaw === 'production' || envRaw === 'prod';
  return {
    clientId: options?.clientId || process.env.EBAY_CLIENT_ID || '',
    clientSecret: options?.clientSecret || process.env.EBAY_CLIENT_SECRET || '',
    redirectUri: options?.redirectUri || options?.ruName || process.env.EBAY_REDIRECT_URI || process.env.EBAY_CALLBACK_URL || '',
    environment: isProd ? 'production' : 'sandbox',
  };
};

const getAuthBase = (environment?: string) => {
  const env = environment || process.env.EBAY_ENVIRONMENT;
  return (env === 'production' || env === 'prod')
    ? 'https://auth.ebay.com/oauth2/authorize'
    : 'https://auth.sandbox.ebay.com/oauth2/authorize';
};

const getTokenBase = (environment?: string) => {
  const env = environment || process.env.EBAY_ENVIRONMENT;
  return (env === 'production' || env === 'prod')
    ? 'https://api.ebay.com/identity/v1/oauth2/token'
    : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
};

const getApiBase = (environment?: string) => {
  const env = environment || process.env.EBAY_ENVIRONMENT;
  return (env === 'production' || env === 'prod')
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com';
};

export class EbayService {
  async refreshAccessToken(accountId: string): Promise<string> {
    const config = getConfig();
    const account = await prisma.ebayAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    if (!account.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenUrl = getTokenBase();

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: decrypt(account.refreshToken),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to refresh token: ${errorData.error_description || response.statusText}`);
    }

    const tokens = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const refreshTokenExpiry = tokens.refresh_token_expires_in
      ? (() => { const d = new Date(); d.setSeconds(d.getSeconds() + tokens.refresh_token_expires_in); return d; })()
      : undefined;

    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: expiresAt,
        ...(refreshTokenExpiry && { refreshTokenExpiry }),
      },
    });

    return tokens.access_token;
  }

  async getValidToken(accountId: string): Promise<{ accessToken: string; account: any }> {
    const account = await prisma.ebayAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    if (new Date() >= account.tokenExpiry) {
      const newToken = await this.refreshAccessToken(accountId);
      return { accessToken: newToken, account: await prisma.ebayAccount.findUnique({ where: { id: accountId } }) };
    }

    return { accessToken: decrypt(account.accessToken), account };
  }

  async generateAuthUrl(workspaceId: string, options?: DynamicEbayAuthOptions) {
    const config = getConfig(options);
    
    // Check if client_id is available
    if (!config.clientId) {
      console.warn('[eBay OAuth] No EBAY_CLIENT_ID configured. Set it in Settings or env variables.');
    }

    const statePayload = {
      workspaceId,
      frontendUrl: options?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
      redirectUri: config.redirectUri,
      environment: config.environment,
      ...(options?.clientId ? { clientId: options.clientId } : {}),
      ...(options?.clientSecret ? { clientSecret: encrypt(options.clientSecret) } : {}),
    };

    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');
    const scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/sell.account',
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
    });

    const authBase = getAuthBase(config.environment);
    return {
      authUrl: `${authBase}?${params.toString()}`,
      redirectUri: config.redirectUri,
      frontendUrl: statePayload.frontendUrl,
      environment: config.environment,
    };
  }

  async handleCallback(code: string, state: string) {
    let stateData: {
      workspaceId: string;
      frontendUrl?: string;
      redirectUri?: string;
      environment?: string;
      clientId?: string;
      clientSecret?: string;
    };

    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (!stateData.workspaceId) throw new Error('Missing workspaceId in state');
    } catch {
      throw new Error('Invalid state parameter');
    }

    const decryptedSecret = stateData.clientSecret ? decrypt(stateData.clientSecret) : undefined;
    const config = getConfig({
      clientId: stateData.clientId,
      clientSecret: decryptedSecret,
      redirectUri: stateData.redirectUri,
      environment: stateData.environment,
    });

    console.log('[eBay OAuth] Dynamic token exchange with redirect_uri:', config.redirectUri, 'env:', config.environment);

    const tokenResponse = await fetch(getTokenBase(config.environment), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('[eBay OAuth] Token exchange failed:', errorData);
      throw new Error(`Failed to exchange code for tokens: ${errorData.error_description || tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();

    const ebayClient = new EbayClient(tokens.access_token, config.environment === 'sandbox');
    const accountInfo = await ebayClient.get<any>('/sell/account/v1/account');

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const refreshTokenExpiry = tokens.refresh_token_expires_in
      ? (() => { const d = new Date(); d.setSeconds(d.getSeconds() + tokens.refresh_token_expires_in); return d; })()
      : undefined;

    await prisma.ebayAccount.upsert({
      where: {
        workspaceId_ebayUserId: {
          workspaceId,
          ebayUserId: accountInfo.username,
        },
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: expiresAt,
        ...(refreshTokenExpiry && { refreshTokenExpiry }),
        username: accountInfo.username,
        feedbackScore: accountInfo.feedbackScore,
        feedbackPercent: accountInfo.feedbackPercentage,
        sellerLevel: accountInfo.sellerLevel,
        storeName: accountInfo.storeName,
        scopes: tokens.scope?.split(' ') || [],
      },
      create: {
        workspaceId,
        ebayUserId: accountInfo.username,
        username: accountInfo.username,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: expiresAt,
        refreshTokenExpiry,
        marketplace: 'EBAY_GB',
        feedbackScore: accountInfo.feedbackScore,
        feedbackPercent: accountInfo.feedbackPercentage,
        sellerLevel: accountInfo.sellerLevel,
        storeName: accountInfo.storeName,
        scopes: tokens.scope?.split(' ') || [],
        isSandbox: config.environment === 'sandbox',
      },
    });

    return { success: true };
  }

  async getConnectedAccounts(workspaceId: string) {
    return prisma.ebayAccount.findMany({
      where: { workspaceId, isActive: true },
      select: {
        id: true,
        username: true,
        marketplace: true,
        storeName: true,
        feedbackScore: true,
        feedbackPercent: true,
        sellerLevel: true,
        isSandbox: true,
        activeListings: true,
        totalSales: true,
        lastSyncedAt: true,
        syncStatus: true,
        createdAt: true,
      },
    });
  }

  async syncListings(workspaceId: string, accountId: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const { accessToken } = await this.getValidToken(accountId);
    const ebayClient = new EbayClient(accessToken, account.isSandbox);

    const response = await ebayClient.get<any>('/sell/inventory/v1/inventory_item', {
      params: { limit: 100, offset: 0 },
    });

    const items = response.total || 0;

    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: {
        activeListings: items,
        lastSyncedAt: new Date(),
        syncStatus: 'completed',
      },
    });

    return { success: true, synced: items };
  }

  async getListings(workspaceId: string, accountId: string, page = 1, limit = 20) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const { accessToken } = await this.getValidToken(accountId);
    const ebayClient = new EbayClient(accessToken, account.isSandbox);

    return ebayClient.get<any>('/sell/inventory/v1/inventory_item', {
      params: { limit, offset: (page - 1) * limit },
    });
  }

  async syncOrders(workspaceId: string, accountId: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const { accessToken } = await this.getValidToken(accountId);
    const ebayClient = new EbayClient(accessToken, account.isSandbox);

    const filter = encodeURIComponent('orderfulfillmentstatus:{PAID_NOT_SHIPPED,PAID_NOT_SHIPPED}');
    const response = await ebayClient.get<any>(`/sell/fulfillment/v1/order?filter=${filter}&limit=50`);

    const orders = response.orders || [];

    for (const order of orders) {
      const ebayOrderId = String(order.legacyOrderId || order.id);
      await prisma.order.upsert({
        where: { ebayOrderId },
        update: {
          status: 'PAYMENT_RECEIVED',
          total: parseFloat(order.total?.value || '0'),
          buyerUsername: order.buyer?.username || 'unknown',
        },
        create: {
          workspaceId,
          ebayAccountId: accountId,
          ebayOrderId,
          buyerUsername: order.buyer?.username || 'unknown',
          total: parseFloat(order.total?.value || '0'),
          subtotal: parseFloat(order.subtotal?.value || order.total?.value || '0'),
          currency: order.total?.currencyCode || 'GBP',
          status: 'PAYMENT_RECEIVED',
          paymentStatus: 'PAID',
          items: order.lineItems || [],
          ebayCreatedAt: new Date(order.creationDate || Date.now()),
        },
      });
    }

    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: 'completed',
      },
    });

    return { success: true, synced: orders.length };
  }

  async getOrders(workspaceId: string, accountId: string, page = 1, limit = 20) {
    return prisma.order.findMany({
      where: { workspaceId, ebayAccountId: accountId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createListing(workspaceId: string, accountId: string, data: any) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    const { accessToken } = await this.getValidToken(accountId);
    const ebayClient = new EbayClient(accessToken, account.isSandbox);

    const inventoryItem = await ebayClient.post<any>('/sell/inventory/v1/inventory_item', {
      sku: data.sku || `SKU-${Date.now()}`,
      title: data.title,
      description: data.description,
      condition: { conditionId: data.conditionId || 1000 },
      product: {
        title: data.title,
        description: data.description,
        imageUrls: data.images || [],
      },
    });

    const offer = await ebayClient.post<any>('/sell/inventory/v1/offer', {
      availableQuantity: data.quantity || 1,
      price: { value: data.price.toString(), currency: 'GBP' },
      inventoryItemId: inventoryItem.inventoryItemId,
      format: data.format || 'FIXED_PRICE',
      marketplaceId: 'EBAY_GB',
    });

    const published = await ebayClient.post<any>(`/sell/inventory/v1/offer/${offer.offerId}/publish`);

    const listing = await prisma.listing.create({
      data: {
        workspaceId,
        ebayAccountId: accountId,
        title: data.title,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        sku: data.sku,
        images: data.images || [],
        ebayItemId: published.ebayOfferId,
        status: 'ACTIVE',
      },
    });

    return listing;
  }

  async removeAccount(workspaceId: string, accountId: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('eBay account not found');
    }

    await prisma.ebayAccount.delete({
      where: { id: accountId },
    });

    return { success: true };
  }
}
