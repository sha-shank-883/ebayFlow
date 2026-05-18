"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Search } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useSaveShortcut, useCancelShortcut } from "@/hooks/use-keyboard-shortcuts";
import toast from "react-hot-toast";
import { SEOScore } from "@/components/ui/seo-score";

export default function SEOPage() {
  const [seoData, setSeoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    adminApi.seo.list()
      .then(setSeoData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (seo: any) => {
    setEditing(seo.pageId);
    setFormData({
      metaTitle: seo.metaTitle || "",
      metaDescription: seo.metaDescription || "",
      metaKeywords: seo.metaKeywords || "",
      ogTitle: seo.ogTitle || "",
      ogDescription: seo.ogDescription || "",
      ogImageUrl: seo.ogImageUrl || "",
      canonicalUrl: seo.canonicalUrl || "",
      robotsIndex: seo.robotsIndex ?? true,
      customJsonLd: seo.customJsonLd || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(editing);
    try {
      await adminApi.seo.update(editing, formData);
      toast.success("SEO settings saved");
      setEditing(null);
      const updated = await adminApi.seo.list();
      setSeoData(updated);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(null);
    }
  };

  useSaveShortcut(handleSave);
  useCancelShortcut(() => setEditing(null));

  if (loading) {
    return <PageSkeleton stats={false} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
        <p className="text-muted-foreground mt-1">Manage meta tags, Open Graph, and structured data for each page.</p>
      </div>

      <div className="space-y-4">
        {seoData.map((seo) => (
          <Card key={seo.pageId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{seo.page?.title || seo.pageId}</CardTitle>
                  <CardDescription>/{seo.page?.slug}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEdit(seo)}>
                  <Search className="mr-2 h-4 w-4" /> Edit SEO
                </Button>
              </div>
            </CardHeader>
            {editing === seo.pageId && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} />
                    <p className="text-xs text-muted-foreground">{formData.metaTitle?.length || 0}/60 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} rows={3} />
                    <p className="text-xs text-muted-foreground">{formData.metaDescription?.length || 0}/160 characters</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Input value={formData.metaKeywords} onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OG Title</Label>
                    <Input value={formData.ogTitle} onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Description</Label>
                    <Input value={formData.ogDescription} onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OG Image URL</Label>
                    <Input value={formData.ogImageUrl} onChange={(e) => setFormData({ ...formData, ogImageUrl: e.target.value })} placeholder="/og.jpg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Canonical URL</Label>
                    <Input value={formData.canonicalUrl} onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })} placeholder="https://ebayflow.ai/page" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="robotsIndex" checked={formData.robotsIndex} onCheckedChange={(checked) => setFormData({ ...formData, robotsIndex: checked })} />
                  <Label htmlFor="robotsIndex">Allow search engines to index this page</Label>
                </div>
                <div className="space-y-2">
                  <Label>Custom JSON-LD (Structured Data)</Label>
                  <Textarea value={formData.customJsonLd} onChange={(e) => setFormData({ ...formData, customJsonLd: e.target.value })} rows={5} className="font-mono text-sm" placeholder='{"@context": "https://schema.org", ...}' />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving === seo.pageId}>
                    {saving === seo.pageId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save SEO Settings
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
                  </div>
                  <div className="col-span-1">
                    <SEOScore
                      title={formData.metaTitle || ""}
                      description={formData.metaDescription || ""}
                      slug={seo.page?.slug || ""}
                      imageUrl={formData.ogImageUrl || ""}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
