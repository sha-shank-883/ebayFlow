"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit2, Trash2, Save, X, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { BulkActionsBar, useBulkActions } from "@/components/ui/bulk-actions";
import { atomicBulkAction } from "@/lib/transaction";
import toast from "react-hot-toast";

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  const bulkActions = useBulkActions<typeof redirects[0]>();

  useEffect(() => { loadRedirects(); }, []);

  const loadRedirects = async () => {
    try { const data = await adminApi.redirects.list(); setRedirects(data); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing.id) await adminApi.redirects.update(editing.id, editing);
      else await adminApi.redirects.create(editing);
      toast.success("Saved"); setEditing(null); loadRedirects();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.redirects.delete(id); loadRedirects(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  const handleBulkEnable = async () => {
    await bulkActions.enableSelected(async (ids) => {
      await atomicBulkAction(ids.map((id) => () => adminApi.redirects.update(id, { isActive: true })));
      loadRedirects();
    });
  };

  const handleBulkDisable = async () => {
    await bulkActions.disableSelected(async (ids) => {
      await atomicBulkAction(ids.map((id) => () => adminApi.redirects.update(id, { isActive: false })));
      loadRedirects();
    });
  };

  const handleBulkDelete = async () => {
    await bulkActions.deleteSelected(async (ids) => {
      await atomicBulkAction(ids.map((id) => () => adminApi.redirects.delete(id)));
      loadRedirects();
    });
  };

  if (loading) return <TableSkeleton rows={5} columns={3} />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redirects</h1>
          <p className="text-muted-foreground mt-1">Manage 301/302 redirects for SEO and URL changes.</p>
        </div>
        <Button onClick={() => setEditing({ from: "", to: "", statusCode: 301, isActive: true })}><Plus className="mr-2 h-4 w-4" /> Add Redirect</Button>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} Redirect</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>From</Label><Input value={editing.from} onChange={(e) => setEditing({ ...editing, from: e.target.value })} placeholder="/old-page" /></div>
              <div className="space-y-2"><Label>To</Label><Input value={editing.to} onChange={(e) => setEditing({ ...editing, to: e.target.value })} placeholder="/new-page" /></div>
            </div>
            <div className="space-y-2"><Label>Status Code</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editing.statusCode} onChange={(e) => setEditing({ ...editing, statusCode: parseInt(e.target.value) })}>
                <option value={301}>301 (Permanent)</option><option value={302}>302 (Temporary)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={bulkActions.selectedIds.length === redirects.length && redirects.length > 0}
              onCheckedChange={() => bulkActions.selectAll(redirects.map((r) => r.id))}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {redirects.map(r => (
              <div key={r.id} className={`flex items-center justify-between p-4 ${bulkActions.selectedIds.includes(r.id) ? 'bg-muted/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={bulkActions.selectedIds.includes(r.id)}
                    onCheckedChange={() => bulkActions.toggleSelect(r.id)}
                  />
                  <code className="text-sm bg-muted px-2 py-1 rounded">{r.from}</code>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">{r.to}</code>
                  <Badge variant="outline">{r.statusCode}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(r)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteRedirect(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <BulkActionsBar
        count={bulkActions.selectedIds.length}
        onEnable={handleBulkEnable}
        onDisable={handleBulkDisable}
        onDelete={handleBulkDelete}
        onClear={bulkActions.clearSelection}
      />
    </div>
  );
}
