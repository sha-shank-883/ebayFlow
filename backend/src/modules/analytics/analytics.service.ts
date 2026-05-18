import { prisma } from '../../lib/prisma';
import { startOfDay, subDays, endOfDay, format } from 'date-fns';

export class AnalyticsService {
  async getDashboardStats(workspaceId: string) {
    const now = new Date();
    const thirtyDaysAgo = startOfDay(subDays(now, 30));

    const [totalSales, orderCount, activeListings, totalProfit, lowStockCount] = await Promise.all([
      prisma.order.aggregate({
        where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.listing.count({
        where: { workspaceId, status: 'ACTIVE' },
      }),
      prisma.order.aggregate({
        where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
        _sum: { netProfit: true },
      }),
      prisma.inventoryItem.count({
        where: {
          workspaceId,
          quantity: { lte: prisma.inventoryItem.fields.lowStockThreshold as any },
        },
      }),
    ]);

    return {
      totalRevenue: Number(totalSales._sum.total || 0),
      totalOrders: orderCount,
      activeListings,
      netProfit: Number(totalProfit._sum.netProfit || 0),
      aov: orderCount > 0 ? Number(totalSales._sum.total || 0) / orderCount : 0,
      lowStockCount,
    };
  }

  async getSalesChartData(workspaceId: string, days = 30) {
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));

    const orders = await prisma.order.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate },
      },
      select: {
        total: true,
        netProfit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyData: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
      dailyData[date] = { date, revenue: 0, profit: 0, orders: 0 };
    }

    orders.forEach((order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd');
      if (dailyData[date]) {
        dailyData[date].revenue += Number(order.total);
        dailyData[date].profit += Number(order.netProfit || 0);
        dailyData[date].orders += 1;
      }
    });

    return Object.values(dailyData);
  }
}
