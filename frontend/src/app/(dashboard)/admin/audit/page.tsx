"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Eye, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadAudits(); }, [page]);

  const loadAudits = async () => {
    try {
      const data = await adminApi.audit.list(page, 50);
      setAudits(data.audits);
      setTotalPages(data.totalPages);
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  if (loading) return <TableSkeleton rows={10} columns={4} />;

  const actionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'TOGGLE': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return '';
    }
  };

  return (
    <div className="space-y-8" role="main" aria-label="Audit log management">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Track all content changes across the website.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border" role="table" aria-label="Audit log entries">
            <div className="flex items-center justify-between p-4 bg-muted/30 font-medium text-sm" role="row" aria-label="Table headers">
              <div className="flex items-center gap-4">
                <span role="columnheader">Action</span>
                <span role="columnheader">Entity</span>
              </div>
              <div className="text-right">
                <span role="columnheader">User & Date</span>
              </div>
            </div>
            {audits.map(audit => (
              <div key={audit.id} className="flex items-center justify-between p-4 hover:bg-muted/50" role="row" aria-label={`Audit entry: ${audit.action} on ${audit.entityType}`}>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={actionColor(audit.action)} aria-label={`Action: ${audit.action}`}>{audit.action}</Badge>
                  <div>
                    <p className="text-sm font-medium">{audit.entityType}</p>
                    <p className="text-xs text-muted-foreground">{audit.entityName || audit.entityId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{audit.userEmail || 'System'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Toast notification area */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
}
