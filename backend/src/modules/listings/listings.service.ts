import { prisma } from '../../lib/prisma';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { AiService } from '../ai/ai.service';
import { EbaySyncService } from '../ebay/ebay-sync.service';
import { EbayInventoryService } from '../ebay/ebay-inventory.service';
import { EbayService } from '../ebay/ebay.service';

export class ListingsService {
  private aiService: AiService;

  constructor() {
    this.aiService = new AiService();
  }

  async create(workspaceId: string, dto: CreateListingDto) {
    return prisma.listing.create({
      data: {
        workspaceId,
        ebayAccountId: dto.ebayAccountId,
        title: dto.title,
        description: dto.description || '',
        price: dto.price,
        quantity: dto.quantity,
        sku: dto.sku,
        images: dto.images || [],
        itemSpecifics: dto.itemSpecifics || {},
        status: dto.status || 'DRAFT',
        isDraft: true,
        searchVector: `${dto.title} ${dto.sku || ''} ${dto.description || ''}`.slice(0, 10000),
      },
    });
  }

  async findAll(workspaceId: string, options: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    accountId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    cursor?: string;
  } = {}) {
    const {
      skip = 0,
      take = 50,
      search,
      status,
      accountId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      cursor,
    } = options;

    const whereClause: any = { workspaceId };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (accountId) {
      whereClause.ebayAccountId = accountId;
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where: whereClause,
        skip: cursor ? undefined : skip,
        take: take + 1,
        orderBy,
        include: {
          imagesList: {
            where: { isPrimary: true },
            select: { ebayImageUrl: true, thumbnailPath: true, s3Url: true },
            take: 1,
          },
          ebayAccount: {
            select: { username: true, storeName: true, isSandbox: true },
          },
        },
      }),
      prisma.listing.count({ where: whereClause }),
    ]);

    let hasNextPage = false;
    if (items.length > take) {
      items.pop();
      hasNextPage = true;
    }

    const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items: items.map((item) => ({
        ...item,
        primaryImage: item.imagesList[0]?.ebayImageUrl || null,
        imagesList: undefined,
      })),
      total,
      skip,
      take,
      nextCursor,
      hasNextPage,
    };
  }

  async findOne(id: string, workspaceId: string) {
    const listing = await prisma.listing.findFirst({
      where: { id, workspaceId },
      include: {
        imagesList: { orderBy: { sortOrder: 'asc' } },
        specifics: { orderBy: { sortOrder: 'asc' } },
        variationsList: { orderBy: { createdAt: 'asc' } },
        revisions: { orderBy: { createdAt: 'desc' }, take: 20 },
        ebayAccount: {
          select: { username: true, storeName: true, isSandbox: true, marketplace: true },
        },
        template: {
          select: { name: true, htmlContent: true },
        },
      },
    });

    if (!listing) {
      throw new Error(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async update(id: string, workspaceId: string, dto: UpdateListingDto, userId?: string) {
    const existing = await this.findOne(id, workspaceId);

    const changes: Record<string, { old: any; new: any }> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null && existing[key as keyof typeof existing] !== value) {
        changes[key] = {
          old: existing[key as keyof typeof existing],
          new: value,
        };
      }
    }

    if (Object.keys(changes).length === 0) return existing;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        searchVector: dto.title || dto.sku || dto.description
          ? `${dto.title || existing.title} ${dto.sku || existing.sku || ''} ${dto.description || existing.description || ''}`.slice(0, 10000)
          : undefined,
      },
    });

    if (Object.keys(changes).length > 0) {
      await prisma.listingRevision.create({
        data: {
          listingId: id,
          workspaceId,
          userId: userId || null,
          revisionNumber: existing.revisionCount + 1,
          changeType: 'edit',
          changes,
          note: `Updated ${Object.keys(changes).join(', ')}`,
        },
      });

      await prisma.listing.update({
        where: { id },
        data: { revisionCount: { increment: 1 } },
      });
    }

    return updated;
  }

  async saveDraft(id: string, workspaceId: string, draftData: any, userId?: string) {
    const existing = await prisma.listing.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) throw new Error('Listing not found');

    const changes: Record<string, { old: any; new: any }> = {};
    for (const [key, value] of Object.entries(draftData)) {
      if (value !== undefined && existing[key as keyof typeof existing] !== value) {
        changes[key] = {
          old: existing[key as keyof typeof existing],
          new: value,
        };
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        isDraft: true,
        draftData: { ...existing.draftData, ...draftData } as any,
        ...draftData,
        searchVector: draftData.title || draftData.sku || draftData.description
          ? `${draftData.title || existing.title} ${draftData.sku || existing.sku || ''} ${draftData.description || existing.description || ''}`.slice(0, 10000)
          : undefined,
      },
    });

    if (Object.keys(changes).length > 0) {
      await prisma.listingRevision.create({
        data: {
          listingId: id,
          workspaceId,
          userId: userId || null,
          revisionNumber: existing.revisionCount + 1,
          changeType: 'draft',
          changes,
          note: 'Draft saved',
        },
      });

      await prisma.listing.update({
        where: { id },
        data: { revisionCount: { increment: 1 } },
      });
    }

    return updated;
  }

  async publishToEbay(id: string, workspaceId: string, userId?: string) {
    const listing = await prisma.listing.findFirst({
      where: { id, workspaceId },
      include: {
        imagesList: { orderBy: { sortOrder: 'asc' } },
        specifics: { orderBy: { sortOrder: 'asc' } },
        variationsList: true,
        ebayAccount: true,
      },
    });

    if (!listing) throw new Error('Listing not found');
    if (!listing.ebayAccountId) throw new Error('Listing must be associated with an eBay account');
    if (listing.status === 'ACTIVE' && listing.ebayItemId) throw new Error('Listing is already active on eBay');

    const snapshot = { ...listing };

    const ebayService = new EbayService();
    const inventoryService = new EbayInventoryService(ebayService, workspaceId);

    const imageUrls = listing.imagesList.map((img) => img.ebayImageUrl);

    const specificsArray = listing.specifics.map((spec) => ({
      name: spec.key,
      value: [spec.value],
    }));

    let result: any;

    try {
      result = await inventoryService.createListing(listing.ebayAccountId, {
        sku: listing.sku || `SKU-${Date.now()}`,
        title: listing.title,
        description: listing.descriptionHtml || listing.description || '',
        price: Number(listing.price),
        quantity: listing.quantity,
        images: imageUrls.length > 0 ? imageUrls : listing.images,
        categoryId: listing.categoryId || '30120',
      });

      await prisma.listing.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          isDraft: false,
          ebayItemId: result.itemId,
          publishedAt: new Date(),
          lastSyncedAt: new Date(),
          draftData: null,
        },
      });

      await prisma.listingRevision.create({
        data: {
          listingId: id,
          workspaceId,
          userId: userId || null,
          revisionNumber: listing.revisionCount + 1,
          changeType: 'publish',
          changes: { status: { old: listing.status, new: 'ACTIVE' } },
          snapshot: snapshot as any,
          note: 'Published to eBay',
        },
      });

      await prisma.listing.update({
        where: { id },
        data: { revisionCount: { increment: 1 } },
      });

      return { success: true, itemId: result.itemId, offerId: result.offerId };
    } catch (error: any) {
      await prisma.listingRevision.create({
        data: {
          listingId: id,
          workspaceId,
          userId: userId || null,
          revisionNumber: listing.revisionCount + 1,
          changeType: 'publish',
          changes: { error: { old: null, new: error.message } },
          snapshot: snapshot as any,
          note: `Publish failed: ${error.message}`,
        },
      });
      throw error;
    }
  }

  async rollbackToRevision(id: string, workspaceId: string, revisionId: string, userId?: string) {
    const revision = await prisma.listingRevision.findFirst({
      where: { id: revisionId, listingId: id },
    });

    if (!revision) throw new Error('Revision not found');
    if (!revision.snapshot) throw new Error('No snapshot available for this revision');

    const snapshot = revision.snapshot as any;

    const { id: _, createdAt: __, updatedAt: ___, ...dataToRestore } = snapshot;

    await prisma.listing.update({
      where: { id },
      data: {
        ...dataToRestore,
        isDraft: true,
        draftData: snapshot,
      },
    });

    await prisma.listingRevision.create({
      data: {
        listingId: id,
        workspaceId,
        userId: userId || null,
        revisionNumber: (await prisma.listing.findUnique({ where: { id } }))!.revisionCount + 1,
        changeType: 'rollback',
        changes: { rollback: { old: null, new: `Rolled back to revision ${revision.revisionNumber}` } },
        note: `Rolled back to revision ${revision.revisionNumber}`,
      },
    });

    await prisma.listing.update({
      where: { id },
      data: { revisionCount: { increment: 1 } },
    });

    return { success: true, message: 'Rolled back successfully' };
  }

  async remove(id: string, workspaceId: string) {
    const existing = await this.findOne(id, workspaceId);
    return prisma.listing.delete({ where: { id } });
  }

  async generateDescription(id: string, workspaceId: string) {
    const listing = await this.findOne(id, workspaceId);

    if (!listing.title) {
      throw new Error('Listing must have a title to generate description');
    }

    const { content } = await this.aiService.generateDescription({
      prompt: listing.title,
      tone: 'professional',
    });

    return prisma.listing.update({
      where: { id },
      data: { description: content, descriptionHtml: content },
    });
  }

  async generateTitle(id: string, workspaceId: string) {
    const listing = await this.findOne(id, workspaceId);

    if (!listing.title) {
      throw new Error('Listing must have a title');
    }

    const { content } = await this.aiService.generateTitle({
      prompt: listing.title,
    });

    return prisma.listing.update({
      where: { id },
      data: { title: content },
    });
  }

  async bulkUpdate(ids: string[], workspaceId: string, dto: UpdateListingDto, userId?: string) {
    const listings = await prisma.listing.findMany({
      where: { id: { in: ids }, workspaceId },
    });

    const revisions = listings.map((listing) => ({
      listingId: listing.id,
      workspaceId,
      userId: userId || null,
      revisionNumber: listing.revisionCount + 1,
      changeType: 'edit',
      changes: dto as any,
      note: `Bulk update: ${Object.keys(dto).join(', ')}`,
    }));

    const updateData: any = { ...dto };
    if (dto.title || dto.sku || dto.description) {
      updateData.searchVector = `${dto.title || ''} ${dto.sku || ''} ${dto.description || ''}`.slice(0, 10000);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.listing.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: updateData,
      });

      await tx.listingRevision.createMany({ data: revisions });

      await Promise.all(
        ids.map((id) =>
          tx.listing.update({
            where: { id },
            data: { revisionCount: { increment: 1 } },
          })
        )
      );

      return updateResult;
    });

    return result;
  }

  async bulkUpdatePrice(ids: string[], workspaceId: string, price: number, userId?: string) {
    return this.bulkUpdate(ids, workspaceId, { price: price as any }, userId);
  }

  async bulkUpdateQuantity(ids: string[], workspaceId: string, quantity: number, userId?: string) {
    return this.bulkUpdate(ids, workspaceId, { quantity }, userId);
  }

  async bulkUpdateTitle(ids: string[], workspaceId: string, title: string, userId?: string) {
    return this.bulkUpdate(ids, workspaceId, { title }, userId);
  }

  async bulkDelete(ids: string[], workspaceId: string) {
    return prisma.listing.deleteMany({
      where: { id: { in: ids }, workspaceId },
    });
  }

  async getRevisions(listingId: string, workspaceId: string) {
    return prisma.listingRevision.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSpecific(listingId: string, workspaceId: string, key: string, value: string) {
    const listing = await prisma.listing.findFirst({ where: { id: listingId, workspaceId } });
    if (!listing) throw new Error('Listing not found');

    return prisma.listingSpecific.upsert({
      where: { listingId_key: { listingId, key } },
      update: { value },
      create: {
        listingId,
        workspaceId,
        key,
        value,
        valueType: 'text',
      },
    });
  }

  async removeSpecific(listingId: string, workspaceId: string, key: string) {
    return prisma.listingSpecific.delete({
      where: { listingId_key: { listingId, key } },
    });
  }

  async addImage(listingId: string, workspaceId: string, imageUrl: string, sortOrder?: number) {
    const listing = await prisma.listing.findFirst({ where: { id: listingId, workspaceId } });
    if (!listing) throw new Error('Listing not found');

    const maxOrder = await prisma.listingImage.aggregate({
      where: { listingId },
      _max: { sortOrder: true },
    });

    return prisma.listingImage.create({
      data: {
        listingId,
        workspaceId,
        ebayImageUrl: imageUrl,
        sortOrder: sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async removeImage(imageId: string, workspaceId: string) {
    return prisma.listingImage.delete({
      where: { id: imageId },
    });
  }

  async reorderImages(listingId: string, workspaceId: string, imageIds: string[]) {
    await Promise.all(
      imageIds.map((imageId, index) =>
        prisma.listingImage.update({
          where: { id: imageId },
          data: { sortOrder: index, isPrimary: index === 0 },
        })
      )
    );

    return { success: true };
  }

  async addVariation(listingId: string, workspaceId: string, data: {
    sku?: string;
    price: number;
    quantity: number;
    specifics?: Record<string, string>;
    images?: string[];
  }) {
    const listing = await prisma.listing.findFirst({ where: { id: listingId, workspaceId } });
    if (!listing) throw new Error('Listing not found');

    return prisma.listingVariation.create({
      data: {
        listingId,
        workspaceId,
        sku: data.sku,
        price: data.price,
        quantity: data.quantity,
        specifics: data.specifics || {},
        images: data.images || [],
      },
    });
  }

  async updateVariation(variationId: string, workspaceId: string, data: {
    price?: number;
    quantity?: number;
    specifics?: Record<string, string>;
    images?: string[];
  }) {
    const variation = await prisma.listingVariation.findFirst({
      where: { id: variationId },
      include: { listing: { where: { workspaceId } } },
    });
    if (!variation) throw new Error('Variation not found');

    return prisma.listingVariation.update({
      where: { id: variationId },
      data,
    });
  }

  async removeVariation(variationId: string, workspaceId: string) {
    const variation = await prisma.listingVariation.findFirst({
      where: { id: variationId },
      include: { listing: { where: { workspaceId } } },
    });
    if (!variation) throw new Error('Variation not found');

    return prisma.listingVariation.delete({
      where: { id: variationId },
    });
  }
}
