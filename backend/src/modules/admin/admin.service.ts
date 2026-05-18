import { prisma } from '../../lib/prisma';

export class AdminService {
  async getSystemStats() {
    const [userCount, workspaceCount, activeListings, totalOrders] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        isActive: true,
      },
    });

    const revenue = await prisma.order.aggregate({
      _sum: { total: true },
    });

    return {
      stats: {
        users: userCount,
        workspaces: workspaceCount,
        activeListings,
        totalOrders,
        totalRevenue: Number(revenue._sum.total || 0),
      },
      recentUsers,
    };
  }

  async getAllUsers(skip = 0, take = 50) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              workspaces: true,
              refreshTokens: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total, skip, take };
  }

  async getAllWorkspaces(skip = 0, take = 50) {
    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
              listings: true,
              ebayAccounts: true,
              orders: true,
            },
          },
        },
      }),
      prisma.workspace.count(),
    ]);

    return { workspaces, total, skip, take };
  }

  async toggleUserStatus(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
  }
}
