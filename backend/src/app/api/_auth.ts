import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (!decoded.workspaceId && decoded.userId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: 'asc' },
      });
      if (membership) {
        decoded.workspaceId = membership.workspaceId;
      }
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function requireSuperAdmin(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true, email: true, name: true, id: true },
  });
  
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') return null;
  
  return dbUser;
}

export async function requireAdminRole(request: Request, requiredPermission: string) {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      adminUsers: {
        include: {
          role: true,
        },
      },
    },
  });
  
  if (!dbUser) return null;
  
  // SUPER_ADMIN has all permissions
  if (dbUser.role === 'SUPER_ADMIN') return dbUser;
  
  // Check admin role permissions
  const adminUser = dbUser.adminUsers.find(au => au.isActive);
  if (!adminUser) return null;
  
  const permissions = adminUser.role.permissions as string[];
  if (permissions.includes('*') || permissions.includes(requiredPermission)) {
    return dbUser;
  }
  
  return null;
}

export function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}

export function noWorkspace() {
  return NextResponse.json({ message: 'No workspace found' }, { status: 400 });
}
