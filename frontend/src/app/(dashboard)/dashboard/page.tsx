"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import dynamic from "next/dynamic";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
  Clock,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const RevenueChart = dynamic(
  () => import("@/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> }
);

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([
          fetchApi<any>("/analytics?action=dashboard"),
          fetchApi<any[]>("/analytics?action=sales-chart&days=7"),
        ]);
        setStats(statsRes);
        setSalesData(salesRes || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Total Revenue", value: stats?.totalRevenue ? `£${stats.totalRevenue.toLocaleString()}` : "£0", change: stats?.totalRevenue ? "+0%" : "N/A", trend: "up" as const, icon: TrendingUp, color: "text-profit", bg: "bg-profit/10", border: "border-profit/20", glow: "shadow-profit/5" },
    { title: "Active Listings", value: stats?.activeListings?.toLocaleString() || "0", change: "+0", trend: "up" as const, icon: Package, color: "text-brand", bg: "bg-brand/10", border: "border-brand/20", glow: "shadow-brand/5" },
    { title: "Orders (30 days)", value: stats?.totalOrders?.toLocaleString() || "0", change: "+0%", trend: "up" as const, icon: ShoppingCart, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", glow: "shadow-accent/5" },
    { title: "Low Stock Items", value: stats?.lowStockCount?.toLocaleString() || "0", change: "0", trend: "down" as const, icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", glow: "shadow-warning/5" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ai-tools">
            <Button variant="outline" className="rounded-xl bg-card backdrop-blur-md border-border/80 text-foreground hover:bg-muted hover:text-foreground h-10 transition-all">
              <Zap className="mr-2 h-4 w-4 text-brand" />
              AI Tools
            </Button>
          </Link>
          <Link href="/listings">
            <Button className="rounded-xl bg-gradient-primary text-foreground shadow-glow hover:opacity-90 h-10 transition-all border-0">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={`bg-card backdrop-blur-xl border-border shadow-2xl hover:border-border/80 transition-all duration-300 relative overflow-hidden group ${kpi.glow}`}>
            {/* Subtle Gradient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 opacity-20`} />
            
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">{kpi.title}</CardTitle>
              <div className={`p-2.5 rounded-xl ${kpi.bg} border ${kpi.border} backdrop-blur-md shadow-inner group-hover:scale-110 transition-all duration-500`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="text-3xl font-bold text-foreground tracking-tight group-hover:translate-x-1 transition-transform duration-500">{kpi.value}</div>
              <div className="flex items-center gap-2 mt-3">
                <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${kpi.trend === "up" ? "bg-profit/10 text-profit border border-profit/20 shadow-profit/5 shadow-glow" : "bg-warning/10 text-warning border border-warning/20"}`}>
                  {kpi.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {kpi.change}
                </div>
                <span className="text-xs text-muted-foreground/60">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-1 md:col-span-4 bg-card backdrop-blur-xl border-border shadow-2xl flex flex-col group overflow-hidden">
          <CardHeader className="border-b border-border pb-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-lg font-bold tracking-tight">Revenue Overview</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">Daily sales performance tracking</CardDescription>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-inner group-hover:bg-brand/10 transition-colors">
                <BarChart3 className="h-4 w-4 text-brand" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 flex-1 min-h-[320px]">
            <RevenueChart data={salesData} />
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-3 bg-card backdrop-blur-xl border-border shadow-2xl flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border pb-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand" />
              <CardTitle className="text-foreground text-lg font-bold tracking-tight">Quick Actions</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground mt-1">Optimize your operations instantly</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 flex-1">
            <Link href="/listings" className="block">
              <div className="group flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:border-brand/40 hover:bg-brand/5 transition-all duration-500 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand/0 to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-brand/20 transition-all duration-500">
                    <Package className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground/90 group-hover:text-foreground transition-colors">Manage Listings</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors">Control your eBay catalog</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-brand transition-all transform group-hover:translate-x-1 relative z-10" />
              </div>
            </Link>

            <Link href="/orders" className="block">
              <div className="group flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-500 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-500">
                    <ShoppingCart className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground/90 group-hover:text-foreground transition-colors">View Orders</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors">Shipment and fulfillment</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-accent transition-all transform group-hover:translate-x-1 relative z-10" />
              </div>
            </Link>

            <Link href="/inventory" className="block">
              <div className="group flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:border-warning/40 hover:bg-warning/5 transition-all duration-500 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-warning/0 to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-warning/20 transition-all duration-500">
                    <AlertCircle className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground/90 group-hover:text-foreground transition-colors">Inventory</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors">Stock levels and alerts</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-warning transition-all transform group-hover:translate-x-1 relative z-10" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

