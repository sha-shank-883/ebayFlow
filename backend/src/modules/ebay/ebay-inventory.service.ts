import { EbayClient } from '../../lib/ebay-client';
import { prisma } from '../../lib/prisma';
import { EbayService } from './ebay.service';

export class EbayInventoryService {
  private ebayService: EbayService;
  private workspaceId: string;

  constructor(ebayService: EbayService, workspaceId: string) {
    this.ebayService = ebayService;
    this.workspaceId = workspaceId;
  }

  private async getClient(accountId: string): Promise<{ client: EbayClient; account: any }> {
    const { accessToken, account } = await this.ebayService.getValidToken(accountId);
    return { client: new EbayClient(accessToken, account.isSandbox), account };
  }

  async syncInventory(accountId: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId: this.workspaceId },
    });
    if (!account) throw new Error('eBay account not found');

    const { client } = await this.getClient(accountId);
    const data: any = await client.get('/sell/inventory/v1/inventory_item', {
      params: { limit: 100, offset: 0 },
    });

    const items = data.inventoryItems || [];

    for (const item of items) {
      await prisma.listing.upsert({
        where: {
          ebayItemId: item.legacyItemId?.toString() || item.sku,
        },
        update: {
          title: item.product?.title,
          description: item.product?.description,
          price: parseFloat(item.price?.value || '0'),
          quantity: item.availability?.shipToLocationAvailability?.quantity || 0,
          images: item.product?.imageUrls || [],
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
        create: {
          workspaceId: this.workspaceId,
          ebayAccountId: account.id,
          ebayItemId: item.legacyItemId?.toString() || item.sku,
          sku: item.sku,
          title: item.product?.title || 'Unknown',
          description: item.product?.description || '',
          price: parseFloat(item.price?.value || '0'),
          quantity: item.availability?.shipToLocationAvailability?.quantity || 0,
          images: item.product?.imageUrls || [],
          status: 'ACTIVE',
        },
      });
    }

    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date(), syncStatus: 'completed' },
    });

    return { count: items.length };
  }

  async updatePriceQuantity(accountId: string, sku: string, data: { price?: number; quantity?: number }) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId: this.workspaceId },
    });
    if (!account) throw new Error('eBay account not found');

    const { client } = await this.getClient(accountId);
    const payload: any = {};

    if (data.price !== undefined) {
      payload.price = {
        value: data.price.toString(),
        currency: 'GBP'
      };
    }

    if (data.quantity !== undefined) {
      payload.availability = {
        shipToLocationAvailability: {
          quantity: data.quantity
        }
      };
    }

    await client.put(`/sell/inventory/v1/inventory_item/${sku}`, payload);

    return { success: true };
  }

  async createListing(accountId: string, data: {
    sku: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
    images: string[];
    categoryId?: string;
  }) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId: this.workspaceId },
    });
    if (!account) throw new Error('eBay account not found');

    const { client } = await this.getClient(accountId);

    await client.put(`/sell/inventory/v1/inventory_item/${data.sku}`, {
      product: {
        title: data.title,
        description: data.description,
        imageUrls: data.images,
      },
      availability: {
        shipToLocationAvailability: {
          quantity: data.quantity,
        },
      },
      condition: 'NEW',
    });

    const offerResponse: any = await client.post('/sell/inventory/v1/offer', {
      sku: data.sku,
      marketplaceId: 'EBAY_GB',
      format: 'FIXED_PRICE',
      availableQuantity: data.quantity,
      categoryId: data.categoryId || '30120',
      listingDescription: data.description,
      pricingSummary: {
        price: {
          value: data.price.toString(),
          currency: 'GBP',
        },
      },
      listingPolicies: {
        fulfillmentPolicyId: '31313131',
        paymentPolicyId: '31313131',
        returnPolicyId: '31313131',
      },
      merchantLocationKey: 'default',
    });

    const offerId = offerResponse.offerId;

    const publishResponse: any = await client.post(`/sell/inventory/v1/offer/${offerId}/publish`);

    return {
      itemId: publishResponse.listingId,
      offerId: offerId,
    };
  }
}
