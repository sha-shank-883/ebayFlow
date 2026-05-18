"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ChevronDown } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function FAQPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => { loadFAQs(); }, []);

  const loadFAQs = async () => {
    try { const data = await adminApi.faqs.list(true); setCategories(data); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCats(next);
  };

  const saveCat = async () => {
    try {
      if (editingCat.id) await adminApi.faqs.updateCategory(editingCat.id, editingCat);
      else await adminApi.faqs.create("category", editingCat);
      toast.success("Saved"); setEditingCat(null); loadFAQs();
    } catch (error: any) { toast.error(error.message); }
  };

  const saveItem = async () => {
    try {
      if (editingItem.id) await adminApi.faqs.updateItem(editingItem.id, editingItem);
      else await adminApi.faqs.create("item", editingItem);
      toast.success("Saved"); setEditingItem(null); loadFAQs();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category and all its questions?")) return;
    try { await adminApi.faqs.deleteCategory(id); loadFAQs(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.faqs.deleteItem(id); loadFAQs(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <PageSkeleton content="list" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Manager</h1>
          <p className="text-muted-foreground mt-1">Manage FAQ categories and questions.</p>
        </div>
        <Button onClick={() => setEditingCat({ name: "", order: categories.length })}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
      </div>

      {editingCat && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editingCat.id ? "Edit" : "New"} Category</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editingCat.order} onChange={(e) => setEditingCat({ ...editingCat, order: parseInt(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCat}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingCat(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingItem && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editingItem.id ? "Edit" : "New"} Question</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Question</Label><Input value={editingItem.question} onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })} /></div>
            <div className="space-y-2"><Label>Answer</Label><Textarea value={editingItem.answer} onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editingItem.categoryId} onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editingItem.order} onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveItem}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleCat(cat.id)} className="p-1 hover:bg-muted rounded"><ChevronDown className={`h-5 w-5 transition-transform ${expandedCats.has(cat.id) ? 'rotate-180' : ''}`} /></button>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <Badge variant="outline">{cat.items?.length || 0} questions</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingItem({ categoryId: cat.id, question: "", answer: "", order: (cat.items?.length || 0) })}><Plus className="mr-2 h-3.5 w-3.5" /> Add Question</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingCat(cat)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCat(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            {expandedCats.has(cat.id) && cat.items && (
              <CardContent className="space-y-2">
                {cat.items.map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.question}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.answer}</p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
