import { prisma } from '../../lib/prisma';
import { EbayService } from '../ebay/ebay.service';

export class OrdersService {
  async findAll(workspaceId: string, query?: any) {
    const { skip = 0, take = 50, search, status } = query || {};
    const whereClause: any = { workspaceId };

    if (search) {
      whereClause.OR = [
        { ebayOrderId: { contains: search, mode: 'insensitive' } },
        { buyerUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, workspaceId: string) {
    const order = await prisma.order.findFirst({
      where: { id, workspaceId },
    });

    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, workspaceId: string, status: string) {
    await this.findOne(id, workspaceId);

    const updateData: any = { status };
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    return prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async syncOrders(workspaceId: string) {
    const ebayService = new EbayService(workspaceId);
    return ebayService.syncOrders();
  }
}
