/**
 * Executes multiple async operations in parallel and returns results.
 * If any operation fails, the entire batch is considered failed.
 *
 * @param operations - Array of async functions to execute
 * @returns Array of results from each operation
 */
export async function atomicBulkAction<T>(
  operations: (() => Promise<T>)[]
): Promise<T[]> {
  const results = await Promise.allSettled(operations.map((op) => op()));

  const failures = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected"
  );

  if (failures.length > 0) {
    const successCount = results.length - failures.length;
    throw new Error(
      `${failures.length} of ${results.length} operations failed${successCount > 0 ? ` (${successCount} succeeded)` : ""}`
    );
  }

  return (results as PromiseFulfilledResult<T>[]).map((r) => r.value);
}
