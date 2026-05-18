"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useSaveShortcut, useCancelShortcut } from "@/hooks/use-keyboard-shortcuts";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ContentPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [newSection, setNewSection] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await adminApi.pages.list(true);
      setPages(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (pageId: string) => {
    setSectionsLoading(true);
    try {
      const data = await adminApi.sections.list(pageId, true);
      setSections(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSectionsLoading(false);
    }
  };

  const togglePageActive = async (id: string) => {
    try {
      await adminApi.pages.toggleActive(id);
      loadPages();
      toast.success("Page status updated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const savePage = async () => {
    try {
      if (editingPage.id) {
        await adminApi.pages.update(editingPage.id, editingPage);
        toast.success("Page updated");
      } else {
        await adminApi.pages.create(editingPage);
        toast.success("Page created");
      }
      setEditingPage(null);
      loadPages();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const saveSection = async () => {
    try {
      if (editingSection.id) {
        await adminApi.sections.update(editingSection.id, {
          ...editingSection,
          content: typeof editingSection.content === 'string' ? JSON.parse(editingSection.content) : editingSection.content,
          settings: editingSection.settings ? (typeof editingSection.settings === 'string' ? JSON.parse(editingSection.settings) : editingSection.settings) : null,
        });
        toast.success("Section updated");
      } else {
        await adminApi.sections.create(editingSection.pageId, {
          ...editingSection,
          content: typeof editingSection.content === 'string' ? JSON.parse(editingSection.content) : editingSection.content,
        });
        toast.success("Section created");
      }
      setEditingSection(null);
      setNewSection(false);
      loadSections(editingSection.pageId);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSectionActive = async (id: string, pageId: string) => {
    try {
      await adminApi.sections.toggleActive(id);
      loadSections(pageId);
      toast.success("Section status updated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteSection = async (id: string, pageId: string) => {
    if (!confirm("Are you sure? This will soft-delete the section.")) return;
    try {
      await adminApi.sections.delete(id);
      loadSections(pageId);
      toast.success("Section deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useSaveShortcut(saveSection);
  useCancelShortcut(() => { setEditingSection(null); setNewSection(false); });

  if (loading) {
    return <PageSkeleton content="list" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Content</h1>
          <p className="text-muted-foreground mt-1">Manage pages and their sections. Edit content, reorder, and toggle visibility.</p>
        </div>
        <Button onClick={() => setEditingPage({ slug: "", title: "", description: "", template: "default", sortOrder: pages.length })}>
          <Plus className="mr-2 h-4 w-4" /> New Page
        </Button>
      </div>

      {/* Page Editor Modal */}
      {editingPage && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>{editingPage.id ? "Edit Page" : "New Page"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editingPage.slug} onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })} placeholder="e.g., home, about" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingPage.title} onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingPage.description} onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Input value={editingPage.template} onChange={(e) => setEditingPage({ ...editingPage, template: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={editingPage.sortOrder} onChange={(e) => setEditingPage({ ...editingPage, sortOrder: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePage}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingPage(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      <div className="space-y-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <Badge variant={page.isActive ? "default" : "secondary"}>/{page.slug}</Badge>
                  {!page.isActive && <Badge variant="outline">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePageActive(page.id)}>
                    {page.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPage(page)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => loadSections(page.id)}>
                    {sectionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Sections */}
            {sections.length > 0 && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {sections.map((section, idx) => (
                    <div key={section.id} className={`flex items-center justify-between p-3 rounded-lg border ${!section.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">{idx + 1}</span>
                        <Badge variant="outline">{section.sectionType}</Badge>
                        <span className="text-sm font-medium">{section.title || section.sectionKey}</span>
                        {!section.isActive && <Badge variant="secondary">Hidden</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleSectionActive(section.id, page.id)}>
                          {section.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingSection({ ...section, content: JSON.stringify(section.content, null, 2), settings: section.settings ? JSON.stringify(section.settings, null, 2) : '' }); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id, page.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { setNewSection(true); setEditingSection({ pageId: page.id, sectionKey: "", sectionType: "custom-html", title: "", subtitle: "", content: "{}", order: sections.length }); }}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Section
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Section Editor Modal */}
      {(editingSection && (newSection || editingSection.id)) && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>{editingSection.id ? "Edit Section" : "New Section"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Key</Label>
                <Input value={editingSection.sectionKey} onChange={(e) => setEditingSection({ ...editingSection, sectionKey: e.target.value })} placeholder="e.g., hero, features" />
              </div>
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Input value={editingSection.sectionType} onChange={(e) => setEditingSection({ ...editingSection, sectionType: e.target.value })} placeholder="e.g., hero, features, cta" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingSection.title || ""} onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={editingSection.subtitle || ""} onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content (JSON)</Label>
              <Textarea value={editingSection.content} onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })} rows={10} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Settings (JSON, optional)</Label>
              <Textarea value={editingSection.settings || ""} onChange={(e) => setEditingSection({ ...editingSection, settings: e.target.value })} rows={5} className="font-mono text-sm" />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveSection}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => { setEditingSection(null); setNewSection(false); }}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
