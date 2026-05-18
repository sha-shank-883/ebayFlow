"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function NavigationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await adminApi.navigation.list(undefined, true);
      setItems(data);
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing.id) await adminApi.navigation.update(editing.id, editing);
      else await adminApi.navigation.create(editing);
      toast.success("Saved");
      setEditing(null);
      loadItems();
    } catch (error: any) { toast.error(error.message); }
  };

  const toggleActive = async (id: string) => {
    try { await adminApi.navigation.toggleActive(id); loadItems(); toast.success("Updated"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this navigation item?")) return;
    try { await adminApi.navigation.delete(id); loadItems(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <PageSkeleton stats={false} />;

  const headerItems = items.filter(i => i.location === "header");
  const footerItems = items.filter(i => i.location === "footer");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation Builder</h1>
          <p className="text-muted-foreground mt-1">Manage header and footer navigation menus.</p>
        </div>
        <Button onClick={() => setEditing({ location: "header", label: "", href: "", order: 0 })}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} Navigation Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })}>
                  <option value="header">Header</option><option value="footer">Footer</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Column (Footer only)</Label>
                <Input value={editing.column || ""} onChange={(e) => setEditing({ ...editing, column: e.target.value })} placeholder="platform, engine, company, compliance" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Label</Label><Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL</Label><Input value={editing.href} onChange={(e) => setEditing({ ...editing, href: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Parent ID (for dropdowns)</Label><Input value={editing.parentId || ""} onChange={(e) => setEditing({ ...editing, parentId: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Header Menu ({headerItems.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {headerItems.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">{item.order}</span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.href}</span>
                  {!item.isActive && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(item.id)}>{item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(item)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Footer Links ({footerItems.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {footerItems.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{item.column}</Badge>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.href}</span>
                  {!item.isActive && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(item.id)}>{item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(item)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
