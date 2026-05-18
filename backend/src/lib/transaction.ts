import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Executes a function within a Prisma transaction.
 * Automatically rolls back on error and logs the failure.
 *
 * @template T - The return type of the transaction function
 * @param fn - Async function receiving a transaction client
 * @returns The result of the transaction function
 * @throws Re-throws the original error after rollback
 *
 * @example
 * const user = await withTransaction(async (tx) => {
 *   return tx.user.create({ data: { email: 'test@example.com', name: 'Test' } });
 * });
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return fn(tx);
    });
  } catch (error) {
    console.error('[withTransaction] Transaction failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Atomically deletes a page, all its sections, and writes an audit log entry.
 * All operations are wrapped in a single transaction for consistency.
 *
 * @param pageId - The ID of the page to delete
 * @throws If the page does not exist or the transaction fails
 *
 * @example
 * await atomicDeletePage('clx123abc');
 */
export async function atomicDeletePage(pageId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const page = await tx.page.findUnique({
      where: { id: pageId },
      include: { sections: true },
    });

    if (!page) {
      throw new Error(`Page with id "${pageId}" not found`);
    }

    await tx.sectionContent.deleteMany({
      where: { pageId },
    });

    await tx.page.delete({
      where: { id: pageId },
    });

    await tx.contentAudit.create({
      data: {
        action: 'DELETE',
        entityType: 'Page',
        entityId: pageId,
        entityName: page.title,
        changes: {
          before: {
            page: { id: page.id, slug: page.slug, title: page.title },
            sectionsDeleted: page.sections.length,
          },
        },
      },
    });
  });
}

/**
 * Atomically deletes a blog post and its related audit entries.
 * All operations are wrapped in a single transaction for consistency.
 *
 * @param postId - The ID of the blog post to delete
 * @throws If the blog post does not exist or the transaction fails
 *
 * @example
 * await atomicDeleteBlog('clx456def');
 */
export async function atomicDeleteBlog(postId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const post = await tx.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error(`Blog post with id "${postId}" not found`);
    }

    await tx.contentAudit.deleteMany({
      where: {
        entityType: 'BlogPost',
        entityId: postId,
      },
    });

    await tx.blogPost.delete({
      where: { id: postId },
    });

    await tx.contentAudit.create({
      data: {
        action: 'DELETE',
        entityType: 'BlogPost',
        entityId: postId,
        entityName: post.title,
        changes: {
          before: {
            id: post.id,
            slug: post.slug,
            title: post.title,
            status: post.status,
          },
        },
      },
    });
  });
}

/**
 * Atomically toggles the isActive field on any entity and records an audit log.
 * Dynamically determines the model and field based on the entity name.
 *
 * @param entity - The Prisma model name (e.g., 'page', 'blogPost', 'testimonial')
 * @param id - The ID of the entity to toggle
 * @param isActive - The target active state
 * @throws If the entity type is unsupported or the record does not exist
 *
 * @example
 * await atomicToggleActive('page', 'clx789ghi', false);
 */
export async function atomicToggleActive(
  entity: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  return withTransaction(async (tx) => {
    const model = tx[entity as keyof typeof tx];

    if (!model || typeof (model as any).update !== 'function') {
      throw new Error(`Unsupported entity type: "${entity}"`);
    }

    const current = await (model as any).findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error(`${entity} with id "${id}" not found`);
    }

    const previousState = current.isActive;

    await (model as any).update({
      where: { id },
      data: { isActive },
    });

    await tx.contentAudit.create({
      data: {
        action: 'TOGGLE',
        entityType: entity.charAt(0).toUpperCase() + entity.slice(1),
        entityId: id,
        entityName: current.title ?? current.name ?? current.label ?? id,
        changes: {
          before: { isActive: previousState },
          after: { isActive },
        },
      },
    });
  });
}

/**
 * Performs bulk operations (delete, enable, disable) on multiple entities
 * within a single transaction. Records individual audit entries for each item.
 *
 * @param entity - The Prisma model name (e.g., 'page', 'blogPost', 'testimonial')
 * @param ids - Array of entity IDs to operate on
 * @param action - The bulk action: 'delete', 'enable', or 'disable'
 * @returns Object containing counts of successful and failed operations
 * @throws If the entity type is unsupported or the transaction fails
 *
 * @example
 * const result = await atomicBulkAction('page', ['id1', 'id2'], 'delete');
 * console.log(result.successCount);
 */
export async function atomicBulkAction(
  entity: string,
  ids: string[],
  action: 'delete' | 'enable' | 'disable',
): Promise<{ successCount: number; failedIds: string[] }> {
  if (ids.length === 0) {
    return { successCount: 0, failedIds: [] };
  }

  return withTransaction(async (tx) => {
    const model = tx[entity as keyof typeof tx];

    if (!model || typeof (model as any).findMany !== 'function') {
      throw new Error(`Unsupported entity type: "${entity}"`);
    }

    const records = await (model as any).findMany({
      where: { id: { in: ids } },
    });

    const foundIds = new Set(records.map((r: { id: string }) => r.id));
    const failedIds: string[] = [];
    let successCount = 0;

    for (const record of records) {
      try {
        switch (action) {
          case 'delete':
            await (model as any).delete({ where: { id: record.id } });
            break;
          case 'enable':
            await (model as any).update({
              where: { id: record.id },
              data: { isActive: true },
            });
            break;
          case 'disable':
            await (model as any).update({
              where: { id: record.id },
              data: { isActive: false },
            });
            break;
        }

        const entityLabel = record.title ?? record.name ?? record.label ?? record.id;
        await tx.contentAudit.create({
          data: {
            action: action === 'delete' ? 'DELETE' : 'TOGGLE',
            entityType: entity.charAt(0).toUpperCase() + entity.slice(1),
            entityId: record.id,
            entityName: entityLabel,
            changes: {
              action,
              before: action !== 'delete' ? { isActive: record.isActive } : record,
              after: action === 'delete' ? { deleted: true } : { isActive: action === 'enable' },
            },
          },
        });

        successCount++;
      } catch (err) {
        console.error(`[atomicBulkAction] Failed to ${action} ${entity} "${record.id}":`, err);
        failedIds.push(record.id);
      }
    }

    const missingIds = ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      console.warn(`[atomicBulkAction] Entities not found:`, missingIds);
      failedIds.push(...missingIds);
    }

    return { successCount, failedIds };
  });
}
