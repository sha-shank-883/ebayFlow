import { prisma } from '../../lib/prisma';
import { EbayService } from '../ebay/ebay.service';

export class InventoryService {
  async findAll(workspaceId: string, skip = 0, take = 50, search?: string) {
    const whereClause: any = { workspaceId };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where: whereClause }),
    ]);

    return { items, total, skip, take };
  }

  async getLowStockAlerts(workspaceId: string) {
    return prisma.inventoryItem.findMany({
      where: {
        workspaceId,
        quantity: { lte: prisma.inventoryItem.fields.lowStockThreshold },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async updateStock(id: string, workspaceId: string, dto: { quantity?: number; reservedQuantity?: number }) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    return prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.reservedQuantity !== undefined ? { reservedQuantity: dto.reservedQuantity } : {}),
      },
    });
  }
}
