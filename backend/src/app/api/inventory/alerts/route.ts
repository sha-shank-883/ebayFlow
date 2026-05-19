import { NextResponse } from 'next/server';
import { InventoryService } from '@/modules/inventory/inventory.service';
import jwt from 'jsonwebtoken';

const inventoryService = new InventoryService();
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

  try {
    const alerts = await inventoryService.getLowStockAlerts(user.workspaceId);
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
