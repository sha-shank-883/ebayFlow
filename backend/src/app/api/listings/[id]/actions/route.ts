import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const listingsService = new ListingsService();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'generate-description': {
        const result = await listingsService.generateDescription(params.id, user.workspaceId);
        return NextResponse.json(result);
      }

      case 'generate-title': {
        const result = await listingsService.generateTitle(params.id, user.workspaceId);
        return NextResponse.json(result);
      }

      case 'publish': {
        const result = await listingsService.publishToEbay(params.id, user.workspaceId, user.userId);
        return NextResponse.json(result);
      }

      case 'save-draft': {
        const body = await request.json();
        const result = await listingsService.saveDraft(params.id, user.workspaceId, body, user.userId);
        return NextResponse.json(result);
      }

      case 'rollback': {
        const body = await request.json();
        const result = await listingsService.rollbackToRevision(params.id, user.workspaceId, body.revisionId, user.userId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
