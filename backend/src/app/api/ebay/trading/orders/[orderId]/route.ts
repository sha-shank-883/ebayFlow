import { NextResponse } from 'next/server';
import { EbayTradingService } from '@/modules/ebay/ebay-trading.service';
import { EbayXmlUtils } from '@/modules/ebay/ebay-xml.utils';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

function getUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const service = new EbayTradingService(user.workspaceId);
    const result = await service.getOrder(params.orderId);
    const order = result.OrderArray?.Order;
    return NextResponse.json(EbayXmlUtils.parseOrderData(order));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const service = new EbayTradingService(user.workspaceId);
    const body = await request.json();

    switch (action) {
      case 'complete-sale': {
        const result = await service.completeSale(
          params.orderId,
          body.shipped ?? true,
          body.paid ?? true
        );
        return NextResponse.json({ success: true, ...result });
      }

      case 'add-dispatch-time': {
        const result = await service.addDispatchTime(
          params.orderId,
          new Date(body.dispatchTime || Date.now())
        );
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
