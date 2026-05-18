import { EbayClient } from '../../lib/ebay-client';
import { prisma } from '../../lib/prisma';
import { EbayService } from './ebay.service';

export class EbayFulfillmentService {
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

  async syncOrders(accountId: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId: this.workspaceId },
    });
    if (!account) throw new Error('eBay account not found');

    const { client } = await this.getClient(accountId);
    const data: any = await client.get('/sell/fulfillment/v1/order', {
      params: {
        filter: 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}',
        limit: 50,
      },
    });

    const orders = data.orders || [];

    for (const order of orders) {
      await prisma.order.upsert({
        where: { ebayOrderId: order.orderId },
        update: {
          status: order.orderFulfillmentStatus as any,
          total: parseFloat(order.total?.value || '0'),
          updatedAt: new Date(),
        },
        create: {
          workspaceId: this.workspaceId,
          ebayAccountId: account.id,
          ebayOrderId: order.orderId,
          status: order.orderFulfillmentStatus as any,
          total: parseFloat(order.total?.value || '0'),
          subtotal: parseFloat(order.total?.value || '0'),
          currency: order.total?.currency || 'GBP',
          buyerUsername: order.buyer?.username || 'Unknown',
          items: order.lineItems || [],
        },
      });
    }

    await prisma.ebayAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date(), syncStatus: 'completed' },
    });

    return { count: orders.length };
  }

  async uploadTracking(accountId: string, orderId: string, trackingNumber: string, carrier: string) {
    const account = await prisma.ebayAccount.findFirst({
      where: { id: accountId, workspaceId: this.workspaceId },
    });
    if (!account) throw new Error('eBay account not found');

    const { client } = await this.getClient(accountId);

    const data: any = await client.get(`/sell/fulfillment/v1/order/${orderId}`);

    const shippingPayload = {
      lineItems: data.lineItems?.map((item: any) => ({
        lineItemId: item.lineItemId,
        quantity: item.quantity
      })) || [],
      shippedDate: new Date().toISOString(),
      shippingStep: {
        shipToCareOf: data.fulfillmentStartInstructions?.[0]?.shippingStep?.shipToCareOf,
        shipTo: data.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo,
      },
      trackingNumber,
      shippingCarrierCode: carrier
    };

    await client.post(`/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`, shippingPayload);

    return { success: true };
  }
}
