"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Palette, Type, Ruler, Box, Sparkles, Layout } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

const defaultColors = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  secondary: "#64748b",
  background: "#ffffff",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  input: "#e2e8f0",
  ring: "#2563eb",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  accent: "#f1f5f9",
  accentForeground: "#0f172a",
  popover: "#ffffff",
  popoverForeground: "#0f172a",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const defaultFonts = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  mono: "JetBrains Mono, monospace",
  headingWeight: "700",
  bodyWeight: "400",
};

const defaultLayout = {
  headerHeight: "4rem",
  footerPadding: "3rem",
  sectionPadding: "5rem",
  sidebarWidth: "16rem",
};

export default function ThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeId, setThemeId] = useState<string>("");
  const [colors, setColors] = useState<Record<string, string>>(defaultColors);
  const [fonts, setFonts] = useState<Record<string, string>>(defaultFonts);
  const [layout, setLayout] = useState<Record<string, string>>(defaultLayout);

  useEffect(() => {
    adminApi.theme.list()
      .then((data: any[]) => {
        if (data.length > 0) {
          const theme = data.find((t: any) => t.isDefault) || data[0];
          setThemeId(theme.id);
          if (theme.colors) setColors({ ...defaultColors, ...theme.colors });
          if (theme.fontFamily) setFonts({ ...defaultFonts, ...theme.fontFamily });
          if (theme.layout) setLayout({ ...defaultLayout, ...theme.layout });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!themeId) return;
    setSaving(true);
    try {
      await adminApi.theme.update(themeId, { colors, fontFamily: fonts, layout });
      toast.success("Theme saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton stats={false} />;

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Design</h1>
          <p className="text-muted-foreground mt-1">Manage colors, fonts, spacing, and layout for your entire website.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Theme
        </Button>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Colors</TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center gap-2"><Type className="h-4 w-4" /> Fonts</TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2"><Layout className="h-4 w-4" /> Layout</TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Main brand colors used throughout the site.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ColorPicker label="Primary" value={colors.primary} onChange={(v) => setColors({ ...colors, primary: v })} />
                <ColorPicker label="Primary Hover" value={colors.primaryHover} onChange={(v) => setColors({ ...colors, primaryHover: v })} />
                <ColorPicker label="Secondary" value={colors.secondary} onChange={(v) => setColors({ ...colors, secondary: v })} />
                <ColorPicker label="Success" value={colors.success} onChange={(v) => setColors({ ...colors, success: v })} />
                <ColorPicker label="Warning" value={colors.warning} onChange={(v) => setColors({ ...colors, warning: v })} />
                <ColorPicker label="Info" value={colors.info} onChange={(v) => setColors({ ...colors, info: v })} />
                <ColorPicker label="Destructive" value={colors.destructive} onChange={(v) => setColors({ ...colors, destructive: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Background & Surface</CardTitle>
              <CardDescription>Colors for backgrounds, cards, and surfaces.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ColorPicker label="Background" value={colors.background} onChange={(v) => setColors({ ...colors, background: v })} />
                <ColorPicker label="Foreground" value={colors.foreground} onChange={(v) => setColors({ ...colors, foreground: v })} />
                <ColorPicker label="Card" value={colors.card} onChange={(v) => setColors({ ...colors, card: v })} />
                <ColorPicker label="Card Foreground" value={colors.cardForeground} onChange={(v) => setColors({ ...colors, cardForeground: v })} />
                <ColorPicker label="Popover" value={colors.popover} onChange={(v) => setColors({ ...colors, popover: v })} />
                <ColorPicker label="Popover Foreground" value={colors.popoverForeground} onChange={(v) => setColors({ ...colors, popoverForeground: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Muted & Accent</CardTitle>
              <CardDescription>Subtle colors for secondary content and accents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ColorPicker label="Muted" value={colors.muted} onChange={(v) => setColors({ ...colors, muted: v })} />
                <ColorPicker label="Muted Foreground" value={colors.mutedForeground} onChange={(v) => setColors({ ...colors, mutedForeground: v })} />
                <ColorPicker label="Accent" value={colors.accent} onChange={(v) => setColors({ ...colors, accent: v })} />
                <ColorPicker label="Accent Foreground" value={colors.accentForeground} onChange={(v) => setColors({ ...colors, accentForeground: v })} />
                <ColorPicker label="Border" value={colors.border} onChange={(v) => setColors({ ...colors, border: v })} />
                <ColorPicker label="Input" value={colors.input} onChange={(v) => setColors({ ...colors, input: v })} />
                <ColorPicker label="Ring" value={colors.ring} onChange={(v) => setColors({ ...colors, ring: v })} />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-xl border" style={{ backgroundColor: colors.background }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>Color Preview</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: value }} />
                  <span className="text-xs font-mono">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Families</CardTitle>
              <CardDescription>Choose fonts for different text elements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Heading Font</Label>
                <Input
                  value={fonts.heading}
                  onChange={(e) => setFonts({ ...fonts, heading: e.target.value })}
                  placeholder="Inter, system-ui, sans-serif"
                />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: fonts.heading }}>
                  Preview: The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Body Font</Label>
                <Input
                  value={fonts.body}
                  onChange={(e) => setFonts({ ...fonts, body: e.target.value })}
                  placeholder="Inter, system-ui, sans-serif"
                />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: fonts.body }}>
                  Preview: The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Mono Font</Label>
                <Input
                  value={fonts.mono}
                  onChange={(e) => setFonts({ ...fonts, mono: e.target.value })}
                  placeholder="JetBrains Mono, monospace"
                />
                <p className="text-sm text-muted-foreground" style={{ fontFamily: fonts.mono }}>
                  Preview: const x = "The quick brown fox";
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Font Weights</CardTitle>
              <CardDescription>Set default font weights for headings and body text.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Heading Weight</Label>
                  <Input
                    value={fonts.headingWeight}
                    onChange={(e) => setFonts({ ...fonts, headingWeight: e.target.value })}
                    placeholder="700"
                  />
                  <p style={{ fontWeight: parseInt(fonts.headingWeight) || 700, fontFamily: fonts.heading }}>
                    Heading Preview
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Body Weight</Label>
                  <Input
                    value={fonts.bodyWeight}
                    onChange={(e) => setFonts({ ...fonts, bodyWeight: e.target.value })}
                    placeholder="400"
                  />
                  <p style={{ fontWeight: parseInt(fonts.bodyWeight) || 400, fontFamily: fonts.body }}>
                    Body text preview with normal weight
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5" /> Layout Dimensions</CardTitle>
              <CardDescription>Control spacing and dimensions across the site.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Header Height</Label>
                  <Input value={layout.headerHeight} onChange={(e) => setLayout({ ...layout, headerHeight: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sidebar Width</Label>
                  <Input value={layout.sidebarWidth} onChange={(e) => setLayout({ ...layout, sidebarWidth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Section Padding</Label>
                  <Input value={layout.sectionPadding} onChange={(e) => setLayout({ ...layout, sectionPadding: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Footer Padding</Label>
                  <Input value={layout.footerPadding} onChange={(e) => setLayout({ ...layout, footerPadding: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Box className="h-5 w-5" /> Layout Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="h-8 bg-muted flex items-center px-4 text-xs">Header ({layout.headerHeight})</div>
                <div className="flex">
                  <div className="w-32 bg-muted/50 min-h-[200px] flex items-center justify-center text-xs p-2 text-center">
                    Sidebar ({layout.sidebarWidth})
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-20 bg-muted/30 rounded mb-4 flex items-center justify-center text-xs">Content Area</div>
                    <div className="h-20 bg-muted/30 rounded flex items-center justify-center text-xs">Content Area</div>
                  </div>
                </div>
                <div className="h-12 bg-muted flex items-center justify-center text-xs">Footer ({layout.footerPadding})</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your theme looks with sample content.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="p-8 rounded-xl border space-y-6"
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  fontFamily: fonts.body,
                }}
              >
                <h1 style={{ fontFamily: fonts.heading, fontWeight: parseInt(fonts.headingWeight), color: colors.foreground }} className="text-3xl">
                  Heading Example
                </h1>
                <p style={{ color: colors.mutedForeground }}>
                  This is body text with the selected font and weight. It demonstrates how your content will look with the current theme settings.
                </p>

                <div className="flex gap-4">
                  <button
                    className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-6 py-2 rounded-lg font-medium border transition-colors hover:bg-muted"
                    style={{ borderColor: colors.border, color: colors.foreground }}
                  >
                    Secondary Button
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {["success", "warning", "info"].map((type) => (
                    <div
                      key={type}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${(colors as any)[type]}15`, border: `1px solid ${(colors as any)[type]}30` }}
                    >
                      <Badge style={{ backgroundColor: (colors as any)[type], color: "#fff" }}>{type}</Badge>
                      <p className="text-sm mt-2" style={{ color: colors.mutedForeground }}>Alert message example</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                  <h3 style={{ fontFamily: fonts.heading, color: colors.cardForeground }} className="font-bold mb-2">Card Example</h3>
                  <p style={{ color: colors.mutedForeground }} className="text-sm">
                    This is a card component with the current theme colors applied.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Theme Changes
        </Button>
      </div>
    </div>
  );
}
