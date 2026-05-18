"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Save, X, History } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SearchFilter, useSearchFilter } from "@/components/ui/search-filter";
import { Pagination } from "@/components/ui/pagination";
import { useSaveShortcut, useCancelShortcut } from "@/hooks/use-keyboard-shortcuts";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useDraftPreview, DraftPreviewProvider, DraftPreviewModal } from "@/components/ui/draft-preview";
import { VersionHistory } from "@/components/ui/version-history";
import toast from "react-hot-toast";

function BlogContent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { filteredItems, searchQuery, setSearchQuery } = useSearchFilter(posts, ["title", "excerpt"]);

  useEffect(() => { loadPosts(); }, [currentPage]);

  const loadPosts = async () => {
    try { const data = await adminApi.blog.list(`?page=${currentPage}&limit=20`, true); setPosts(data.posts); setTotalPages(data.pagination.totalPages); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing.id) await adminApi.blog.update(editing.id, editing);
      else await adminApi.blog.create(editing);
      toast.success("Saved"); setEditing(null); loadPosts();
    } catch (error: any) { toast.error(error.message); }
  };

  const handlePreview = () => {
    if (editing) {
      setPreviewContent({ title: editing.title, html: editing.content, type: "blog" });
      setPreviewOpen(true);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.blog.delete(id); loadPosts(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  useSaveShortcut(handleSave);
  useCancelShortcut(() => setEditing(null));

  if (loading) return <PageSkeleton content="list" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Manager</h1>
          <p className="text-muted-foreground mt-1">Create and manage blog posts.</p>
        </div>
        <Button onClick={() => setEditing({ title: "", slug: "", excerpt: "", content: "", status: "DRAFT", metaTitle: "", metaDescription: "" })}><Plus className="mr-2 h-4 w-4" /> New Post</Button>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} Post</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Excerpt</Label><Textarea value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Content</Label><RichTextEditor content={editing.content} onChange={(html) => setEditing({ ...editing, content: html })} placeholder="Write your post..." /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Status</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Meta Title</Label><Input value={editing.metaTitle || ""} onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })} /></div>
              <div className="space-y-2"><Label>Meta Description</Label><Input value={editing.metaDescription || ""} onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="secondary" onClick={handlePreview}>Preview</Button>
              {editing.id && (
                <Button variant="outline" onClick={() => setShowHistory(!showHistory)}><History className="mr-2 h-4 w-4" /> History</Button>
              )}
              <Button variant="outline" onClick={() => { setEditing(null); setShowHistory(false); }}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editing?.id && showHistory && (
        <VersionHistory
          entityType="blog"
          entityId={editing.id}
          onRestore={async (versionId) => {
            try {
              const restored = await adminApi.blog.restoreVersion(editing.id, versionId);
              setEditing(restored);
              loadPosts();
              toast.success("Version restored");
            } catch (error: any) {
              toast.error(error.message);
            }
          }}
        />
      )}

      <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search by title or excerpt..." />

      <div className="space-y-4">
        {filteredItems.map(post => (
          <Card key={post.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">/{post.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'DRAFT' ? 'secondary' : 'outline'}>{post.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(post)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {previewContent && (
        <DraftPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          content={previewContent}
        />
      )}
    </div>
  );
}

export default function BlogPage() {
  return (
    <DraftPreviewProvider>
      <BlogContent />
    </DraftPreviewProvider>
  );
}
