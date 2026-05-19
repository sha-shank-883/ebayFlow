"use client";

import { useEffect, useState, useMemo } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Search } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useSaveShortcut, useCancelShortcut } from "@/hooks/use-keyboard-shortcuts";
import toast from "react-hot-toast";

const PAGE_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "pricing", label: "Pricing" },
  { value: "features", label: "Features" },
  { value: "faq", label: "FAQ" },
  { value: "privacy", label: "Privacy" },
  { value: "terms", label: "Terms" },
];

const PAGE_SECTION_KEYS: Record<string, string[]> = {
  home: ["hero", "features", "how-it-works", "trust-signals", "logos", "testimonials", "pricing-preview", "cta", "audit", "audit-features", "audit-form", "cta-benefits"],
  about: ["about-content", "values", "milestones"],
  contact: ["contact-form", "contact-info"],
  pricing: ["pricing-section", "guarantees", "trust-signals", "faqs"],
  features: ["feature-sections", "comparison"],
  faq: ["faq-section"],
  privacy: [],
  terms: [],
};

function contentPreview(content: any): string {
  if (!content) return "No content";
  const str = typeof content === "string" ? content : JSON.stringify(content);
  return str.length > 100 ? str.slice(0, 100) + "..." : str;
}

export default function ContentPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [allSections, setAllSections] = useState<Record<string, any[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [newSection, setNewSection] = useState(false);
  const [selectedPage, setSelectedPage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      loadAllSections();
    }
  }, [pages]);

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

  const loadAllSections = async () => {
    setSectionsLoading(true);
    const sectionsMap: Record<string, any[]> = {};
    try {
      const promises = pages.map(async (page) => {
        try {
          const data = await adminApi.sections.list(page.id, true);
          sectionsMap[page.id] = data;
        } catch {
          sectionsMap[page.id] = [];
        }
      });
      await Promise.all(promises);
      setAllSections(sectionsMap);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSectionsLoading(false);
    }
  };

  const getPageBySlug = (slug: string) => pages.find((p) => p.slug === slug);

  const filteredSections = useMemo(() => {
    const result: Record<string, any[]> = {};
    const pageSlugs = selectedPage === "all" ? PAGE_OPTIONS.filter((o) => o.value !== "all").map((o) => o.value) : [selectedPage];

    for (const slug of pageSlugs) {
      const page = getPageBySlug(slug);
      if (!page) {
        result[slug] = [];
        continue;
      }
      const sections = allSections[page.id] || [];
      const filtered = sections.filter((s) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          (s.sectionKey || "").toLowerCase().includes(q) ||
          (s.title || "").toLowerCase().includes(q) ||
          contentPreview(s.content).toLowerCase().includes(q) ||
          (s.sectionType || "").toLowerCase().includes(q)
        );
      });
      result[slug] = filtered;
    }
    return result;
  }, [selectedPage, searchQuery, allSections, pages]);

  const totalSectionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slug of PAGE_OPTIONS.filter((o) => o.value !== "all").map((o) => o.value)) {
      const page = getPageBySlug(slug);
      counts[slug] = page ? (allSections[page.id] || []).length : 0;
    }
    return counts;
  }, [allSections, pages]);

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
      let parsedContent: any;
      try {
        parsedContent = typeof editingSection.content === "string" ? JSON.parse(editingSection.content) : editingSection.content;
      } catch {
        toast.error("Invalid JSON in content field");
        return;
      }

      let parsedSettings: any = null;
      if (editingSection.settings) {
        try {
          parsedSettings = typeof editingSection.settings === "string" ? JSON.parse(editingSection.settings) : editingSection.settings;
        } catch {
          toast.error("Invalid JSON in settings field");
          return;
        }
      }

      if (editingSection.id) {
        await adminApi.sections.update(editingSection.id, {
          ...editingSection,
          content: parsedContent,
          settings: parsedSettings,
        });
        toast.success("Section updated");
      } else {
        await adminApi.sections.create(editingSection.pageId, {
          ...editingSection,
          content: parsedContent,
          settings: parsedSettings,
        });
        toast.success("Section created");
      }
      setEditingSection(null);
      setNewSection(false);
      loadAllSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSectionActive = async (id: string) => {
    try {
      await adminApi.sections.toggleActive(id);
      loadAllSections();
      toast.success("Section status updated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Are you sure? This will soft-delete the section.")) return;
    try {
      await adminApi.sections.delete(id);
      loadAllSections();
      toast.success("Section deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openNewSection = (pageId: string) => {
    const pageSections = allSections[pageId] || [];
    setNewSection(true);
    setEditingSection({
      pageId,
      sectionKey: "",
      sectionType: "custom-html",
      title: "",
      subtitle: "",
      content: "{}",
      settings: "",
      order: pageSections.length,
    });
  };

  const openEditSection = (section: any) => {
    setEditingSection({
      ...section,
      content: typeof section.content === "string" ? section.content : JSON.stringify(section.content, null, 2),
      settings: section.settings ? (typeof section.settings === "string" ? section.settings : JSON.stringify(section.settings, null, 2)) : "",
    });
  };

  useSaveShortcut(saveSection);
  useCancelShortcut(() => {
    setEditingSection(null);
    setNewSection(false);
  });

  const renderSectionRow = (section: any, idx: number) => (
    <div key={section.id} className={`flex items-center justify-between p-3 rounded-lg border ${!section.isActive ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm text-muted-foreground w-6 shrink-0">{idx + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{section.sectionKey || section.sectionType}</Badge>
            {section.title && <span className="text-sm font-medium truncate">{section.title}</span>}
            {!section.isActive && <Badge variant="secondary">Hidden</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate font-mono">{contentPreview(section.content)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => toggleSectionActive(section.id)} title={section.isActive ? "Hide" : "Show"}>
          {section.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openEditSection(section)} title="Edit">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id)} title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

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

      {/* Page Selector & Search */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label>Filter by Page</Label>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.value !== "all" && totalSectionCount[opt.value] !== undefined && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {totalSectionCount[opt.value]}
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 max-w-md">
          <Label>Search Sections</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by key, title, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {sectionsLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
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

      {/* Sections by Page */}
      <div className="space-y-6">
        {Object.entries(filteredSections).map(([slug, sections]) => {
          const page = getPageBySlug(slug);
          const expectedKeys = PAGE_SECTION_KEYS[slug] || [];
          const pageLabel = PAGE_OPTIONS.find((o) => o.value === slug)?.label || slug;

          return (
            <Card key={slug}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{page?.title || pageLabel}</CardTitle>
                    <Badge variant="secondary">{sections.length} section{sections.length !== 1 ? "s" : ""}</Badge>
                    {expectedKeys.length > 0 && (
                      <Badge variant="outline">{expectedKeys.length} expected</Badge>
                    )}
                    {page && (
                      <>
                        <Badge variant={page.isActive ? "default" : "secondary"}>/{page.slug}</Badge>
                        {!page.isActive && <Badge variant="outline">Inactive</Badge>}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {page && (
                      <Button variant="ghost" size="sm" onClick={() => togglePageActive(page.id)}>
                        {page.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                    {page && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingPage(page)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {page && (
                      <Button variant="outline" size="sm" onClick={() => openNewSection(page.id)}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Section
                      </Button>
                    )}
                  </div>
                </div>
                {expectedKeys.length > 0 && (
                  <CardDescription className="mt-1">
                    Expected: {expectedKeys.join(", ")}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                {sections.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {searchQuery ? "No sections match your search" : "No sections found"}
                    {page && (
                      <Button variant="link" className="ml-1 p-0 h-auto" onClick={() => openNewSection(page.id)}>
                        Add one
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section, idx) => renderSectionRow(section, idx))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Editor Modal */}
      {editingSection && (newSection || editingSection.id) && (
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={editingSection.order ?? 0} onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) || 0 })} />
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
