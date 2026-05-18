import { getJobQueue } from '../../lib/pg-boss';
import { EbaySyncService } from '../ebay/ebay-sync.service';
import { prisma } from '../../lib/prisma';

async function startWorker() {
  const boss = await getJobQueue();

  console.log('Worker started, listening for jobs...');

  await boss.work('full-sync', async (job) => {
    const { workspaceId, accountId } = job.data as { workspaceId: string; accountId?: string };
    console.log(`[Job] Full sync for workspace: ${workspaceId}`);

    try {
      const syncService = new EbaySyncService(workspaceId);
      const result = await syncService.fullSync(accountId);
      console.log(`[Job] Full sync complete: ${result.listingsSynced} listings synced`);
      return result;
    } catch (error) {
      console.error(`[Job] Full sync failed for workspace: ${workspaceId}`, error);
      throw error;
    }
  });

  await boss.work('incremental-sync', async (job) => {
    const { workspaceId, accountId } = job.data as { workspaceId: string; accountId?: string };
    console.log(`[Job] Incremental sync for workspace: ${workspaceId}`);

    try {
      const syncService = new EbaySyncService(workspaceId);
      const result = await syncService.incrementalSync(accountId);
      console.log(`[Job] Incremental sync complete: ${result.listingsSynced} listings updated`);
      return result;
    } catch (error) {
      console.error(`[Job] Incremental sync failed for workspace: ${workspaceId}`, error);
      throw error;
    }
  });

  await boss.work('sync-listing-detail', async (job) => {
    const { workspaceId, listingId } = job.data as { workspaceId: string; listingId: string };
    console.log(`[Job] Syncing listing detail: ${listingId}`);

    try {
      const syncService = new EbaySyncService(workspaceId);
      await syncService.syncListingDetail(listingId);
      console.log(`[Job] Listing detail sync complete: ${listingId}`);
      return { success: true };
    } catch (error) {
      console.error(`[Job] Listing detail sync failed: ${listingId}`, error);
      throw error;
    }
  });

  await boss.schedule('sync-scheduler', '*/15 * * * *');

  await boss.work('sync-scheduler', async () => {
    console.log('[Job] Running periodic sync scheduler...');

    const workspaces = await prisma.workspace.findMany({
      where: {
        plan: { in: ['GROWTH', 'PROFESSIONAL'] },
        ebayAccounts: { some: { isActive: true } },
      },
      include: { ebayAccounts: { where: { isActive: true }, select: { id: true } } },
    });

    console.log(`[Job] Found ${workspaces.length} workspaces to sync`);

    for (const ws of workspaces) {
      for (const account of ws.ebayAccounts) {
        await boss.send('incremental-sync', { workspaceId: ws.id, accountId: account.id });
      }
    }
  });
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
