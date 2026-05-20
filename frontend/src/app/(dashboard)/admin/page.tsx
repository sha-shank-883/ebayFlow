"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Image,
  Star,
  HelpCircle,
  DollarSign,
  Navigation,
  Search,
  ArrowUpRight,
  Loader2,
  ShieldAlert,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statsCards = [
  { key: "pagesCount", label: "Pages", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", href: "/admin/content" },
  { key: "sectionsCount", label: "Sections", icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/admin/content" },
  { key: "blogPostsCount", label: "Blog Posts", icon: FileText, color: "text-green-500", bg: "bg-green-500/10", href: "/admin/blog" },
  { key: "testimonialsCount", label: "Testimonials", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", href: "/admin/testimonials" },
  { key: "faqCategoriesCount", label: "FAQ Categories", icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-500/10", href: "/admin/faqs" },
  { key: "pricingPlansCount", label: "Pricing Plans", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/admin/pricing" },
  { key: "mediaCount", label: "Media Assets", icon: Image, color: "text-pink-500", bg: "bg-pink-500/10", href: "/admin/media" },
  { key: "navItemsCount", label: "Nav Items", icon: Navigation, color: "text-cyan-500", bg: "bg-cyan-500/10", href: "/admin/navigation" },
  { key: "themeCount", label: "Themes", icon: Palette, color: "text-violet-500", bg: "bg-violet-500/10", href: "/admin/theme" },
];

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    adminApi.stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" role="main" aria-label="Admin dashboard overview">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Management</h1>
        <p className="text-muted-foreground mt-1">Manage all content, SEO, navigation, and settings from here.</p>
      </div>

      {user?.role !== "SUPER_ADMIN" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20" role="alert" aria-live="polite">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Super admin access required. Contact your administrator.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Statistics overview">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href} aria-label={`${card.label}: ${stats?.[card.key] ?? 0}`}>
              <Card className="hover:bg-card/80 transition-colors cursor-pointer group" tabIndex={0}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.[card.key] ?? 0}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Quick actions">
          <Link href="/admin/content" aria-label="Edit page content - Modify sections, text, and images">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center" aria-hidden="true">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Edit Page Content</h3>
                  <p className="text-sm text-muted-foreground">Modify sections, text, and images</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/seo" aria-label="SEO Manager - Meta tags, Open Graph, and more">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center" aria-hidden="true">
                  <Search className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">SEO Manager</h3>
                  <p className="text-sm text-muted-foreground">Meta tags, Open Graph, and more</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/navigation" aria-label="Navigation Builder - Header and footer menus">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center" aria-hidden="true">
                  <Navigation className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Navigation Builder</h3>
                  <p className="text-sm text-muted-foreground">Header and footer menus</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/media" aria-label="Media Library - Upload and manage images">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center" aria-hidden="true">
                  <Image className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Media Library</h3>
                  <p className="text-sm text-muted-foreground">Upload and manage images</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings" aria-label="Site Settings - Global config and contact info">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center" aria-hidden="true">
                  <LayoutDashboard className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Site Settings</h3>
                  <p className="text-sm text-muted-foreground">Global config and contact info</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/theme" aria-label="Theme Design - Colors, fonts, and layout">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center" aria-hidden="true">
                  <Palette className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Theme Design</h3>
                  <p className="text-sm text-muted-foreground">Colors, fonts, and layout</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/audit" aria-label="Audit Log - Track all content changes">
            <Card className="hover:bg-card/80 transition-colors cursor-pointer p-6" tabIndex={0}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center" aria-hidden="true">
                  <ShieldAlert className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Audit Log</h3>
                  <p className="text-sm text-muted-foreground">Track all content changes</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentAudits && stats.recentAudits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border" role="list" aria-label="Recent audit activity">
                {stats.recentAudits.slice(0, 10).map((audit: any) => (
                  <div key={audit.id} className="flex items-center justify-between p-4" role="listitem">
                    <div className="flex items-center gap-3">
                      <Badge variant={audit.action === 'CREATE' ? 'default' : audit.action === 'DELETE' ? 'destructive' : 'secondary'} className="text-xs" aria-label={`Action: ${audit.action}`}>
                        {audit.action}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{audit.entityType}</p>
                        <p className="text-xs text-muted-foreground">{audit.entityName || audit.entityId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{audit.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast notification area */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
}
