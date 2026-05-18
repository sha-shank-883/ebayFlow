"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Globe, Mail, Phone, MapPin, Share2, Code } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useSaveShortcut, useCancelShortcut } from "@/hooks/use-keyboard-shortcuts";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    siteName: "",
    tagline: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    socialLinks: {},
    analyticsId: "",
    customCSS: "",
  });

  useEffect(() => {
    adminApi.settings.get()
      .then((data) => {
        const loaded = {
          siteName: data.siteName || "",
          tagline: data.tagline || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          contactAddress: data.contactAddress || "",
          socialLinks: data.socialLinks || {},
          analyticsId: data.analyticsId || "",
          customCSS: data.customCSS || "",
        };
        setSettings(loaded);
        setOriginalSettings(loaded);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.settings.update(settings);
      setOriginalSettings({ ...settings });
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings({ ...originalSettings });
    }
    setEditing(false);
  };

  useSaveShortcut(handleSave);
  useCancelShortcut(handleCancel);

  if (loading) {
    return <PageSkeleton stats={false} />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global site information and contact details.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> General</CardTitle>
          <CardDescription>Basic site information displayed across the website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Contact Information</CardTitle>
          <CardDescription>Displayed on the contact page and footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
              <Input id="contactEmail" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
              <Input id="contactPhone" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactAddress" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
            <Textarea id="contactAddress" value={settings.contactAddress} onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Social Links</CardTitle>
          <CardDescription>Links displayed in the footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input id="twitter" value={settings.socialLinks?.twitter || ""} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" value={settings.socialLinks?.github || ""} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, github: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={settings.socialLinks?.linkedin || ""} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={settings.socialLinks?.facebook || ""} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Third-party analytics tracking IDs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="analyticsId">Google Analytics ID (GA4)</Label>
            <Input id="analyticsId" value={settings.analyticsId} onChange={(e) => setSettings({ ...settings, analyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Custom CSS</CardTitle>
          <CardDescription>Inject custom CSS styles. Use with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.customCSS}
            onChange={(e) => setSettings({ ...settings, customCSS: e.target.value })}
            rows={10}
            className="font-mono text-sm"
            placeholder="/* Your custom CSS here */"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
