import { useState, useCallback, useEffect } from "react";

/**
 * Represents a single version record from the API.
 */
interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  author: string;
  notes: string;
  content: Record<string, unknown>;
}

/**
 * API response shape for the versions endpoint.
 */
interface VersionsResponse {
  versions: Version[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Props for the {@link VersionHistory} component.
 */
interface VersionHistoryProps {
  /** The type of entity being versioned (e.g. "product", "listing"). */
  entityType: string;
  /** The unique identifier of the entity. */
  entityId: string;
  /** Callback invoked when the user confirms a restore action. */
  onRestore: (versionId: string) => void;
}

/**
 * Props for the {@link VersionDiff} component.
 */
interface VersionDiffProps {
  /** The older content snapshot to compare against. */
  oldContent: Record<string, unknown>;
  /** The newer content snapshot to compare. */
  newContent: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  VersionDiff                                                        */
/* ------------------------------------------------------------------ */

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface FieldDiff {
  key: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Computes a flat field-level diff between two content objects.
 */
function computeDiff(
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>,
): FieldDiff[] {
  const allKeys = new Set([...Object.keys(oldContent), ...Object.keys(newContent)]);
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const hasOld = key in oldContent;
    const hasNew = key in newContent;

    if (hasOld && !hasNew) {
      diffs.push({ key, type: "removed", oldValue: oldContent[key] });
    } else if (!hasOld && hasNew) {
      diffs.push({ key, type: "added", newValue: newContent[key] });
    } else if (JSON.stringify(oldContent[key]) !== JSON.stringify(newContent[key])) {
      diffs.push({ key, type: "changed", oldValue: oldContent[key], newValue: newContent[key] });
    }
  }

  return diffs;
}

/**
 * Renders a single value, truncating long strings and stringifying objects.
 */
function renderValue(value: unknown): string {
  if (value === undefined) return "—";
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Displays a side-by-side diff of two content snapshots.
 *
 * Highlights added, removed, and changed fields with colour-coded rows.
 * Large content sections are collapsible.
 */
export function VersionDiff({ oldContent, newContent }: VersionDiffProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const diffs = computeDiff(oldContent, newContent);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const typeStyles: Record<DiffType, { bg: string; badge: string; label: string }> = {
    added: { bg: "bg-emerald-900/30", badge: "bg-emerald-600", label: "Added" },
    removed: { bg: "bg-red-900/30", badge: "bg-red-600", label: "Removed" },
    changed: { bg: "bg-amber-900/30", badge: "bg-amber-600", label: "Changed" },
    unchanged: { bg: "bg-gray-800/30", badge: "bg-gray-600", label: "Unchanged" },
  };

  if (diffs.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">No differences detected.</p>
    );
  }

  return (
    <div className="space-y-2">
      {diffs.map(({ key, type, oldValue, newValue }) => {
        const style = typeStyles[type];
        const isCollapsed = collapsed.has(key);
        const isLongValue =
          (typeof newValue === "string" && newValue.length > 120) ||
          (typeof oldValue === "string" && oldValue.length > 120) ||
          (typeof newValue === "object" && newValue !== null) ||
          (typeof oldValue === "object" && oldValue !== null);

        return (
          <div
            key={key}
            className={`rounded-lg border border-gray-700 ${style.bg} overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => isLongValue && toggleCollapse(key)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left ${isLongValue ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${style.badge} text-white`}>
                  {style.label}
                </span>
                <span className="text-sm font-mono text-gray-200">{key}</span>
              </div>
              {isLongValue && (
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {(!isLongValue || !isCollapsed) && (
              <div className="grid grid-cols-2 gap-0 border-t border-gray-700">
                <div className="px-4 py-3 border-r border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Old</p>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all font-mono">
                    {renderValue(oldValue)}
                  </pre>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">New</p>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all font-mono">
                    {renderValue(newValue)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VersionHistory                                                     */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10;

/**
 * Fetches version history from the API.
 */
async function fetchVersions(
  entityType: string,
  entityId: string,
  page: number,
): Promise<VersionsResponse> {
  const params = new URLSearchParams({
    entityType,
    entityId,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const res = await fetch(`/api/admin/versions?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch versions: ${res.statusText}`);
  return res.json();
}

/**
 * Displays a paginated timeline of versions for a given entity.
 *
 * Each version entry shows the date, author, and notes.
 * Users can view version content in a modal and restore previous versions
 * with a confirmation dialog.
 */
export function VersionHistory({ entityType, entityId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchVersions(entityType, entityId, page)
      .then((data) => {
        if (!cancelled) {
          setVersions(data.versions);
          setTotal(data.total);
          setPage(data.page);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, page]);

  const handleRestore = useCallback(() => {
    if (restoreTarget) {
      onRestore(restoreTarget);
      setRestoreTarget(null);
    }
  }, [restoreTarget, onRestore]);

  const openDiff = (version: Version) => {
    setSelectedVersion(version);
    setShowDiffModal(true);
  };

  const closeDiff = () => {
    setShowDiffModal(false);
    setSelectedVersion(null);
  };

  return (
    <div className="bg-gray-900 text-gray-100 rounded-xl border border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Version History</h2>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">No versions found.</p>
      )}

      {!loading && !error && versions.length > 0 && (
        <>
          <ol className="relative border-l border-gray-700 ml-3 space-y-6">
            {versions.map((version) => (
              <li key={version.id} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 ring-4 ring-gray-900">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                </span>

                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      v{version.versionNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {version.author}
                  </span>
                </div>

                {version.notes && (
                  <p className="text-sm text-gray-400 mt-2">{version.notes}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => openDiff(version)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreTarget(version.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                  >
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-800">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {/* View Diff Modal */}
      {showDiffModal && selectedVersion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeDiff}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-base font-semibold">
                Version {selectedVersion.versionNumber} — {selectedVersion.author}
              </h3>
              <button
                type="button"
                onClick={closeDiff}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <VersionDiff
                oldContent={{}}
                newContent={selectedVersion.content}
              />
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setRestoreTarget(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-2">Restore Version</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to restore this version? This action will create a new version
              based on the selected snapshot.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestore}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
