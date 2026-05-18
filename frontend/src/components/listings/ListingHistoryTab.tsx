"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface ListingHistoryTabProps {
  listingId: string;
  revisions: any[];
  onRollback: () => void;
}

const changeTypeColors: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  publish: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  edit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sync: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  rollback: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ListingHistoryTab({ listingId, revisions, onRollback }: ListingHistoryTabProps) {
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);

  const handleRollback = async (revisionId: string) => {
    if (!confirm("Roll back to this revision? Current changes will be saved as a draft.")) return;
    setIsRollingBack(revisionId);
    try {
      await fetchApi(`/listings/${listingId}/actions?action=rollback`, {
        method: "POST",
        body: JSON.stringify({ revisionId }),
      });
      toast.success("Rolled back successfully");
      onRollback();
    } catch (error: any) {
      toast.error(error.message || "Rollback failed");
    } finally {
      setIsRollingBack(null);
    }
  };

  const getChangesSummary = (changes: any) => {
    if (!changes) return [];
    return Object.entries(changes).map(([key, value]: [string, any]) => ({
      field: key,
      old: value?.old,
      new: value?.new,
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Revision History
          </CardTitle>
          <CardDescription>Track all changes and roll back to previous versions</CardDescription>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No revisions yet</p>
              <p className="text-sm text-muted-foreground">Changes will appear here as you edit</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision, index) => {
                const changes = getChangesSummary(revision.changes);
                const isExpanded = expandedRevision === revision.id;

                return (
                  <div key={revision.id} className="relative">
                    {index < revisions.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                    )}

                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">{revision.revisionNumber}</span>
                        </div>
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={changeTypeColors[revision.changeType] || "bg-muted"}>
                                {revision.changeType}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(revision.createdAt))} ago
                              </span>
                            </div>
                            {revision.note && (
                              <p className="text-sm mt-1">{revision.note}</p>
                            )}
                          </div>

                          {revision.snapshot && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(revision.id)}
                              disabled={isRollingBack === revision.id}
                              className="rounded-xl shrink-0"
                            >
                              {isRollingBack === revision.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              Rollback
                            </Button>
                          )}
                        </div>

                        {changes.length > 0 && (
                          <button
                            onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                            className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {changes.length} field{changes.length !== 1 ? "s" : ""} changed {isExpanded ? "▾" : "▸"}
                          </button>
                        )}

                        {isExpanded && changes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {changes.map((change, i) => (
                              <div key={i} className="text-xs p-2 rounded-lg bg-muted/50 font-mono">
                                <span className="font-sans font-medium">{change.field}:</span>{" "}
                                <span className="text-red-600 line-through">{JSON.stringify(change.old)}</span>{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="text-emerald-600">{JSON.stringify(change.new)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
