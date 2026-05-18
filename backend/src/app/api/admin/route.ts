import { NextResponse } from 'next/server';
import { AdminService } from '../../../modules/admin/admin.service';
import jwt from 'jsonwebtoken';

const adminService = new AdminService();
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';
  const skip = searchParams.get('skip') || '0';
  const take = searchParams.get('take') || '50';

  try {
    if (action === 'users') {
      const result = await adminService.getAllUsers(parseInt(skip), parseInt(take));
      return NextResponse.json(result);
    }

    if (action === 'workspaces') {
      const result = await adminService.getAllWorkspaces(parseInt(skip), parseInt(take));
      return NextResponse.json(result);
    }

    const stats = await adminService.getSystemStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action } = body;

    if (action === 'toggle-status' && userId) {
      const result = await adminService.toggleUserStatus(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
