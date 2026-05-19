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
  { params }: { params: { itemId: string } }
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  try {
    const service = new EbayTradingService(user.workspaceId);
    const result = await service.getItem(params.itemId, {
      includeWatchCount: searchParams.get('includeWatchCount') === 'true',
      includeItemSpecifics: searchParams.get('includeItemSpecifics') !== 'false',
      includeTaxTable: searchParams.get('includeTaxTable') === 'true',
    });

    return NextResponse.json(EbayXmlUtils.parseItemData(result.Item));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const service = new EbayTradingService(user.workspaceId);
    const body = await request.json();

    switch (action) {
      case 'revise': {
        const result = await service.reviseItem(params.itemId, body);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'end': {
        const result = await service.endItem(params.itemId, body.reason);
        return NextResponse.json({ success: true, ...result });
      }

      case 'relist': {
        const result = await service.relistItem(params.itemId);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'transactions': {
        const result = await service.getItemTransactions(params.itemId, {
          numberOfDays: body.numberOfDays || 30,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
