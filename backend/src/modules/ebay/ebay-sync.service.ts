import { prisma } from '../../lib/prisma';
import { decrypt } from '../../lib/encryption';
import { EbayTradingService, PaginatedResponse } from './ebay-trading.service';
import { EbayXmlUtils } from './ebay-xml.utils';

interface SyncResult {
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  listingsSynced: number;
  imagesSynced: number;
  specificsSynced: number;
  variationsSynced: number;
}

export class EbaySyncService {
  private workspaceId: string;
  private tradingService: EbayTradingService;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.tradingService = new EbayTradingService(workspaceId);
  }

  private async getAccount(): Promise<any> {
    const account = await prisma.ebayAccount.findFirst({
      where: { workspaceId: this.workspaceId, isActive: true },
    });
    if (!account) throw new Error('No active eBay account found for this workspace');
    return account;
  }

  async fullSync(accountId?: string): Promise<SyncResult> {
    const account = accountId
      ? await prisma.ebayAccount.findFirst({ where: { id: accountId, workspaceId: this.workspaceId } })
      : await this.getAccount();

    if (!account) throw new Error('eBay account not found');

    const syncLog = await prisma.syncLog.create({
      data: {
        workspaceId: this.workspaceId,
        ebayAccountId: account.id,
        type: 'full-sync',
        status: 'PENDING',
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    const result: SyncResult = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      listingsSynced: 0,
      imagesSynced: 0,
      specificsSynced: 0,
      variationsSynced: 0,
    };

    try {
      const activeListings = await this.fetchAllActiveListings();
      result.totalQueued = activeListings.length;

      for (const item of activeListings) {
        try {
          const syncResult = await this.syncSingleListing(item, account.id);
          result.totalProcessed++;
          result.listingsSynced += syncResult.listings;
          result.imagesSynced += syncResult.images;
          result.specificsSynced += syncResult.specifics;
          result.variationsSynced += syncResult.variations;
        } catch (error) {
          result.totalFailed++;
          console.error(`Failed to sync listing ${item.itemId}:`, error);
        }
      }

      await prisma.ebayAccount.update({
        where: { id: account.id },
        data: {
          activeListings: result.listingsSynced,
          lastSyncedAt: new Date(),
          syncStatus: 'completed',
        },
      });

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          itemsQueued: result.totalQueued,
          itemsProcessed: result.totalProcessed,
          itemsFailed: result.totalFailed,
          completedAt: new Date(),
          duration: Date.now() - (syncLog.startedAt?.getTime() || Date.now()),
          metadata: {
            listingsSynced: result.listingsSynced,
            imagesSynced: result.imagesSynced,
            specificsSynced: result.specificsSynced,
            variationsSynced: result.variationsSynced,
          },
        },
      });
    } catch (error: any) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          error: error.code || 'SYNC_ERROR',
          errorMessage: error.message,
          completedAt: new Date(),
          duration: Date.now() - (syncLog.startedAt?.getTime() || Date.now()),
        },
      });
      throw error;
    }

    return result;
  }

  private async fetchAllActiveListings(): Promise<any[]> {
    const allItems: any[] = [];
    let page = 1;
    const entriesPerPage = 200;
    const maxPages = 50;

    while (page <= maxPages) {
      try {
        const response = await this.tradingService.getActiveListings({
          entriesPerPage,
          page,
          sort: 'TimeLeft',
        });

        if (!response.items || response.items.length === 0) break;

        allItems.push(...response.items);

        if (response.items.length < entriesPerPage) break;
        if (page >= response.totalPages) break;

        page++;
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, error);
        break;
      }
    }

    return allItems;
  }

  private async syncSingleListing(item: any, accountId: string): Promise<{ listings: number; images: number; specifics: number; variations: number }> {
    const parsed = EbayXmlUtils.parseItemData(item);

    const listing = await prisma.listing.upsert({
      where: {
        ebayItemId: parsed.itemId || `TEMP-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      update: {
        title: parsed.title || 'Unknown',
        subtitle: parsed.subtitle,
        description: parsed.description,
        descriptionHtml: parsed.description,
        price: parsed.currentPrice || parsed.startPrice || 0,
        originalPrice: parsed.startPrice,
        buyItNowPrice: parsed.buyItNowPrice,
        quantity: parsed.quantity,
        quantitySold: parsed.quantitySold,
        quantityAvail: parsed.quantityAvailable || parsed.quantity - parsed.quantitySold,
        status: this.mapListingStatus(parsed.status),
        condition: parsed.conditionDisplayName,
        conditionDesc: parsed.conditionId ? String(parsed.conditionId) : undefined,
        categoryId: parsed.primaryCategory?.id,
        categoryName: parsed.primaryCategory?.name,
        sku: parsed.sku,
        viewCount: parsed.viewCount,
        watchCount: parsed.watchCount,
        ebayCreatedAt: parsed.startTime ? new Date(parsed.startTime) : undefined,
        ebayUpdatedAt: new Date(),
        lastSyncedAt: new Date(),
        searchVector: `${parsed.title} ${parsed.sku || ''} ${parsed.description || ''}`.slice(0, 10000),
      },
      create: {
        workspaceId: this.workspaceId,
        ebayAccountId: accountId,
        ebayItemId: parsed.itemId || `TEMP-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: parsed.title || 'Unknown',
        subtitle: parsed.subtitle,
        description: parsed.description,
        descriptionHtml: parsed.description,
        price: parsed.currentPrice || parsed.startPrice || 0,
        originalPrice: parsed.startPrice,
        buyItNowPrice: parsed.buyItNowPrice,
        quantity: parsed.quantity,
        quantitySold: parsed.quantitySold,
        quantityAvail: parsed.quantityAvailable || parsed.quantity - parsed.quantitySold,
        status: this.mapListingStatus(parsed.status),
        condition: parsed.conditionDisplayName,
        conditionDesc: parsed.conditionId ? String(parsed.conditionId) : undefined,
        categoryId: parsed.primaryCategory?.id,
        categoryName: parsed.primaryCategory?.name,
        sku: parsed.sku,
        viewCount: parsed.viewCount,
        watchCount: parsed.watchCount,
        ebayCreatedAt: parsed.startTime ? new Date(parsed.startTime) : undefined,
        ebayUpdatedAt: new Date(),
        lastSyncedAt: new Date(),
        searchVector: `${parsed.title} ${parsed.sku || ''} ${parsed.description || ''}`.slice(0, 10000),
      },
    });

    let imageCount = 0;
    let specificCount = 0;
    let variationCount = 0;

    if (parsed.itemId) {
      imageCount = await this.syncImages(listing.id, parsed.pictures || []);
      specificCount = await this.syncSpecifics(listing.id, parsed.itemSpecifics || []);
      variationCount = await this.syncVariations(listing.id, item);
    }

    return { listings: 1, images: imageCount, specifics: specificCount, variations: variationCount };
  }

  private async syncImages(listingId: string, pictures: string[]): Promise<number> {
    if (!pictures.length) return 0;

    const existing = await prisma.listingImage.findMany({
      where: { listingId },
      select: { ebayImageUrl: true },
    });
    const existingUrls = new Set(existing.map((e) => e.ebayImageUrl));

    const toCreate = pictures
      .filter((url) => !existingUrls.has(url))
      .map((url, index) => ({
        listingId,
        workspaceId: this.workspaceId,
        ebayImageUrl: url,
        sortOrder: index,
        isPrimary: index === 0,
      }));

    if (toCreate.length === 0) return 0;

    await prisma.listingImage.createMany({ data: toCreate });
    return toCreate.length;
  }

  private async syncSpecifics(listingId: string, specifics: Array<{ name: string; value: string[] }>): Promise<number> {
    if (!specifics.length) return 0;

    const existingKeys = await prisma.listingSpecific.findMany({
      where: { listingId },
      select: { key: true },
    });
    const existingKeySet = new Set(existingKeys.map((e) => e.key));

    const toCreate: any[] = [];
    for (let i = 0; i < specifics.length; i++) {
      const spec = specifics[i];
      if (existingKeySet.has(spec.name)) continue;

      toCreate.push({
        listingId,
        workspaceId: this.workspaceId,
        key: spec.name,
        value: spec.value.join(', '),
        valueType: this.detectValueType(spec.name, spec.value),
        sortOrder: i,
      });
    }

    if (toCreate.length === 0) return 0;

    await prisma.listingSpecific.createMany({ data: toCreate });
    return toCreate.length;
  }

  private async syncVariations(listingId: string, rawItem: any): Promise<number> {
    const variationsData = rawItem.Variations;
    if (!variationsData?.Variation) return 0;

    const variations = Array.isArray(variationsData.Variation)
      ? variationsData.Variation
      : [variationsData.Variation];

    const existingSkus = await prisma.listingVariation.findMany({
      where: { listingId },
      select: { sku: true },
    });
    const existingSkuSet = new Set(existingSkus.map((e) => e.sku).filter(Boolean));

    const toCreate: any[] = [];
    for (const variation of variations) {
      const sku = variation.SKU || null;
      if (sku && existingSkuSet.has(sku)) continue;

      const specifics: Record<string, string> = {};
      if (variation.VariationSpecifics?.NameValueList) {
        const nvList = Array.isArray(variation.VariationSpecifics.NameValueList)
          ? variation.VariationSpecifics.NameValueList
          : [variation.VariationSpecifics.NameValueList];
        for (const nv of nvList) {
          specifics[nv.Name || ''] = Array.isArray(nv.Value) ? nv.Value.join(', ') : nv.Value || '';
        }
      }

      const pictures = variation.PictureURLs?.PictureURL || [];
      const imageUrls = Array.isArray(pictures) ? pictures : pictures ? [pictures] : [];

      toCreate.push({
        listingId,
        workspaceId: this.workspaceId,
        sku,
        price: parseFloat(variation.StartPrice?._ || variation.StartPrice || '0'),
        quantity: parseInt(variation.Quantity || '0'),
        quantitySold: parseInt(variation.SellingStatus?.QuantitySold || '0'),
        specifics,
        images: imageUrls,
        isActive: variation.VariationSpecifics ? true : false,
      });
    }

    if (toCreate.length === 0) return 0;

    await prisma.listingVariation.createMany({ data: toCreate });
    return toCreate.length;
  }

  private detectValueType(name: string, values: string[]): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('compatibility') || lowerName.includes('fitment')) return 'compatibility';
    if (lowerName.includes('size') || lowerName.includes('color') || lowerName.includes('colour')) return 'list';
    if (values.some((v) => !isNaN(Number(v)))) return 'number';
    if (values.some((v) => v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) return 'boolean';
    return 'text';
  }

  private mapListingStatus(ebayStatus: string | null): string {
    if (!ebayStatus) return 'ACTIVE';
    const status = ebayStatus.toLowerCase();
    if (status.includes('active')) return 'ACTIVE';
    if (status.includes('ended')) return 'ENDED';
    if (status.includes('out of stock')) return 'OUT_OF_STOCK';
    if (status.includes('suspend')) return 'SUSPENDED';
    return 'ACTIVE';
  }

  async incrementalSync(accountId?: string): Promise<SyncResult> {
    const account = accountId
      ? await prisma.ebayAccount.findFirst({ where: { id: accountId, workspaceId: this.workspaceId } })
      : await this.getAccount();

    if (!account) throw new Error('eBay account not found');

    const syncLog = await prisma.syncLog.create({
      data: {
        workspaceId: this.workspaceId,
        ebayAccountId: account.id,
        type: 'incremental',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const result: SyncResult = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      listingsSynced: 0,
      imagesSynced: 0,
      specificsSynced: 0,
      variationsSynced: 0,
    };

    try {
      const lastSync = account.lastSyncedAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

      const response = await this.tradingService.getSellerListings({
        entriesPerPage: 200,
        page: 1,
      });

      const recentlyUpdated = response.items.filter((item: any) => {
        const endTime = item.ListingDetails?.EndTime || item.EndTime;
        if (!endTime) return true;
        const endStr = typeof endTime === 'object' ? endTime._ : endTime;
        return new Date(endStr) > lastSync;
      });

      result.totalQueued = recentlyUpdated.length;

      for (const item of recentlyUpdated) {
        try {
          const parsed = EbayXmlUtils.parseItemData(item);
          if (!parsed.itemId) continue;

          const existing = await prisma.listing.findUnique({
            where: { ebayItemId: parsed.itemId },
          });

          if (existing) {
            const syncResult = await this.syncSingleListing(item, account.id);
            result.totalProcessed++;
            result.listingsSynced += syncResult.listings;
            result.imagesSynced += syncResult.images;
            result.specificsSynced += syncResult.specifics;
            result.variationsSynced += syncResult.variations;
          }
        } catch (error) {
          result.totalFailed++;
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          itemsQueued: result.totalQueued,
          itemsProcessed: result.totalProcessed,
          itemsFailed: result.totalFailed,
          completedAt: new Date(),
          duration: Date.now() - (syncLog.startedAt?.getTime() || Date.now()),
          metadata: result,
        },
      });

      await prisma.ebayAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date(), syncStatus: 'completed' },
      });
    } catch (error: any) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          error: error.code || 'SYNC_ERROR',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }

    return result;
  }

  async syncListingDetail(listingId: string): Promise<void> {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, workspaceId: this.workspaceId },
      include: { ebayAccount: true },
    });

    if (!listing || !listing.ebayItemId) {
      throw new Error('Listing not found or has no eBay item ID');
    }

    const itemData = await this.tradingService.getItem(listing.ebayItemId, {
      includeWatchCount: true,
      includeItemSpecifics: true,
      includeItemCompatibilityList: true,
    });

    const getItemResponse = itemData.GetItemResponse || itemData;
    const item = getItemResponse.Item;
    if (!item) throw new Error('No item data returned from eBay');

    const parsed = EbayXmlUtils.parseItemData(item);

    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          title: parsed.title || listing.title,
          subtitle: parsed.subtitle,
          description: parsed.description,
          descriptionHtml: parsed.description,
          price: parsed.currentPrice || parsed.startPrice || listing.price,
          quantity: parsed.quantity,
          quantitySold: parsed.quantitySold,
          quantityAvail: parsed.quantityAvailable || parsed.quantity - parsed.quantitySold,
          watchCount: parsed.watchCount,
          viewCount: parsed.viewCount,
          lastSyncedAt: new Date(),
          searchVector: `${parsed.title} ${parsed.sku || ''} ${parsed.description || ''}`.slice(0, 10000),
        },
      });

      if (parsed.pictures?.length) {
        await tx.listingImage.deleteMany({ where: { listingId } });
        await tx.listingImage.createMany({
          data: parsed.pictures.map((url: string, i: number) => ({
            listingId,
            workspaceId: this.workspaceId,
            ebayImageUrl: url,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        });
      }

      if (parsed.itemSpecifics?.length) {
        await tx.listingSpecific.deleteMany({ where: { listingId } });
        await tx.listingSpecific.createMany({
          data: parsed.itemSpecifics.map((spec: any, i: number) => ({
            listingId,
            workspaceId: this.workspaceId,
            key: spec.name,
            value: spec.value.join(', '),
            valueType: this.detectValueType(spec.name, spec.value),
            sortOrder: i,
          })),
        });
      }
    });
  }

  async getSyncLogs(workspaceId: string, page = 1, limit = 20) {
    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.syncLog.count({ where: { workspaceId } }),
    ]);

    return { logs, total, page, limit };
  }

  async getSyncStats(workspaceId: string) {
    const [total, completed, failed, running] = await Promise.all([
      prisma.syncLog.count({ where: { workspaceId } }),
      prisma.syncLog.count({ where: { workspaceId, status: 'COMPLETED' } }),
      prisma.syncLog.count({ where: { workspaceId, status: 'FAILED' } }),
      prisma.syncLog.count({ where: { workspaceId, status: 'RUNNING' } }),
    ]);

    const lastSync = await prisma.syncLog.findFirst({
      where: { workspaceId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
    });

    return { total, completed, failed, running, lastSyncAt: lastSync?.completedAt };
  }
}
