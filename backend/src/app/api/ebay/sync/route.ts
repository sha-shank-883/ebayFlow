import { NextResponse } from 'next/server';
import { EbaySyncService } from '../../../../modules/ebay/ebay-sync.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '../../_auth';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const accountId = searchParams.get('accountId');

  try {
    const syncService = new EbaySyncService(user.workspaceId);

    switch (action) {
      case 'full-sync': {
        const result = await syncService.fullSync(accountId || undefined);
        return NextResponse.json(result);
      }

      case 'incremental-sync': {
        const result = await syncService.incrementalSync(accountId || undefined);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ message: 'Invalid action. Use: full-sync, incremental-sync' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const syncService = new EbaySyncService(user.workspaceId);

    switch (action) {
      case 'logs': {
        const logs = await syncService.getSyncLogs(user.workspaceId, page, limit);
        return NextResponse.json(logs);
      }

      case 'stats': {
        const stats = await syncService.getSyncStats(user.workspaceId);
        return NextResponse.json(stats);
      }

      default:
        return NextResponse.json({ message: 'Invalid action. Use: logs, stats' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
