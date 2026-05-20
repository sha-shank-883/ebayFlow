"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LineChart,
  Bot,
  CreditCard,
  ShieldAlert,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  FileText,
  Search,
  Menu,
  Image,
  MessageSquare,
  HelpCircle,
  DollarSign,
  ScrollText,
  Users,
  Key,
  ArrowLeftRight,
  Palette,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Listings", href: "/listings", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "AI Tools", href: "/ai-tools", icon: Bot },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminModules = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Site Settings", href: "/admin/settings", icon: Settings },
  { name: "Theme Design", href: "/admin/theme", icon: Palette },
  { name: "Content", href: "/admin/content", icon: FileText },
  { name: "SEO", href: "/admin/seo", icon: Search },
  { name: "Navigation", href: "/admin/navigation", icon: Menu },
  { name: "Media Library", href: "/admin/media", icon: Image },
  { name: "Blog", href: "/admin/blog", icon: MessageSquare },
  { name: "Testimonials", href: "/admin/testimonials", icon: Globe },
  { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { name: "Pricing", href: "/admin/pricing", icon: DollarSign },
  { name: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Roles", href: "/admin/roles", icon: Key },
  { name: "Redirects", href: "/admin/redirects", icon: ArrowLeftRight },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const isWebsiteAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-4 justify-between border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-primary text-white shadow-glow">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">eBay Flow</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-muted text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-4 custom-scrollbar">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const navItem = (
              <Link
                key={item.name}
                href={item.href}
              className={cn(
                  isActive
                    ? "bg-sidebar-accent/10 text-sidebar-accent"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-sidebar-accent" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60",
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    !collapsed && "mr-3"
                  )}
                />
                {!collapsed && item.name}
              </Link>
            );

            if (collapsed) {
              return (
                <TooltipProvider key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-card border-border text-card-foreground">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return navItem;
          })}

          {isWebsiteAdmin && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              {!collapsed && (
                <div className="px-3 mb-2">
                  <span className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em]">Website Admin</span>
                </div>
              )}
              {adminModules.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const navItem = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-amber-400/10 text-amber-400"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                      "group flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
                      collapsed && "justify-center"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-amber-400" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60",
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        !collapsed && "mr-2.5"
                      )}
                    />
                    {!collapsed && item.name}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <TooltipProvider key={item.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                        <TooltipContent side="right" className="bg-card border-border text-amber-400">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return navItem;
              })}
            </div>
          )}
        </nav>
      </div>

      <div className="flex flex-shrink-0 p-3 border-t border-sidebar-border">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9 mx-auto cursor-pointer border border-white/10">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-card border-border text-card-foreground">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-sidebar-muted transition-colors cursor-pointer">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback className="bg-gradient-primary text-white text-sm font-medium">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground/90 truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
            <ThemeToggle size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
