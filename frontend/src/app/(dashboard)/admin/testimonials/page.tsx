"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Star } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { SearchFilter, useSearchFilter } from "@/components/ui/search-filter";
import { BulkActionsBar, useBulkActions } from "@/components/ui/bulk-actions";
import { Pagination } from "@/components/ui/pagination";
import { atomicBulkAction } from "@/lib/transaction";
import toast from "react-hot-toast";

export default function TestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { filteredItems, searchQuery, setSearchQuery } = useSearchFilter(items, ["name", "content"]);

  const bulkActions = useBulkActions<typeof items[0]>();

  useEffect(() => { loadItems(); }, [currentPage]);

  const loadItems = async () => {
    try { const data = await adminApi.testimonials.list(`?page=${currentPage}&limit=20`, true); setItems(data.items); setTotalPages(data.pagination.totalPages); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing.id) await adminApi.testimonials.update(editing.id, editing);
      else await adminApi.testimonials.create(editing);
      toast.success("Saved"); setEditing(null); loadItems();
    } catch (error: any) { toast.error(error.message); }
  };

  const toggleActive = async (id: string) => {
    try { await adminApi.testimonials.toggleActive(id); loadItems(); toast.success("Updated"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.testimonials.delete(id); loadItems(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  const handleBulkEnable = async () => {
    await bulkActions.enableSelected(async (ids) => {
      const ops = ids.map((id) => async () => {
        const item = items.find((i) => i.id === id);
        if (!item?.isActive) await adminApi.testimonials.toggleActive(id);
      });
      await atomicBulkAction(ops);
      loadItems();
    });
  };

  const handleBulkDisable = async () => {
    await bulkActions.disableSelected(async (ids) => {
      const ops = ids.map((id) => async () => {
        const item = items.find((i) => i.id === id);
        if (item?.isActive) await adminApi.testimonials.toggleActive(id);
      });
      await atomicBulkAction(ops);
      loadItems();
    });
  };

  const handleBulkDelete = async () => {
    await bulkActions.deleteSelected(async (ids) => {
      await atomicBulkAction(ids.map((id) => () => adminApi.testimonials.delete(id)));
      loadItems();
    });
  };

  if (loading) return <PageSkeleton content="cards" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground mt-1">Manage customer testimonials displayed on the homepage.</p>
        </div>
        <Button onClick={() => setEditing({ quote: "", author: "", role: "", company: "", rating: 5, stats: "", order: items.length })}><Plus className="mr-2 h-4 w-4" /> Add Testimonial</Button>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} Testimonial</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Quote</Label><Textarea value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Author</Label><Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label><Input value={editing.role || ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></div>
              <div className="space-y-2"><Label>Company</Label><Input value={editing.company || ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: parseInt(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Stats Badge</Label><Input value={editing.stats || ""} onChange={(e) => setEditing({ ...editing, stats: e.target.value })} placeholder="e.g., 40% sales increase" /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or content..." />
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              checked={bulkActions.selectedIds.length === filteredItems.length && filteredItems.length > 0}
              onCheckedChange={() => bulkActions.selectAll(filteredItems.map((i) => i.id))}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => (
          <Card key={item.id} className={`${!item.isActive ? 'opacity-50' : ''} ${bulkActions.selectedIds.includes(item.id) ? 'border-primary' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={bulkActions.selectedIds.includes(item.id)}
                    onCheckedChange={() => bulkActions.toggleSelect(item.id)}
                    className="mt-1"
                  />
                  <div>
                    <CardTitle className="text-base">{item.author}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.role} at {item.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">"{item.quote}"</p>
              {item.stats && <Badge variant="secondary">{item.stats}</Badge>}
              <div className="flex gap-1 mt-3">
                <Button variant="ghost" size="sm" onClick={() => toggleActive(item.id)}>{item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BulkActionsBar
        count={bulkActions.selectedIds.length}
        onEnable={handleBulkEnable}
        onDisable={handleBulkDisable}
        onDelete={handleBulkDelete}
        onClear={bulkActions.clearSelection}
      />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
