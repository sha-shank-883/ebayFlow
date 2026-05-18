"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { Loader2, Download, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, ShoppingCart, Package } from "lucide-react";
import toast from "react-hot-toast";

const RevenueTrendChart = dynamic(
  () => import("@/components/charts/RevenueTrendChart").then((mod) => mod.RevenueTrendChart),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

const CategoryPieChart = dynamic(
  () => import("@/components/charts/CategoryPieChart").then((mod) => mod.CategoryPieChart),
  { ssr: false, loading: () => <div className="h-[200px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [statsRes, salesRes] = await Promise.all([
          fetchApi<any>("/analytics?action=dashboard"),
          fetchApi<any[]>(`/analytics?action=sales-chart&days=${days}`),
        ]);
        setStats(statsRes);
        setSalesData(salesRes || []);
      } catch (error: any) {
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [days]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[160px] rounded-xl bg-card backdrop-blur-xl border-border/80 text-foreground h-10 hover:border-border transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0F1C]/95 border-border/80 text-foreground backdrop-blur-xl">
              <SelectItem value="7" className="focus:bg-card focus:text-foreground cursor-pointer rounded-lg">Last 7 days</SelectItem>
              <SelectItem value="30" className="focus:bg-card focus:text-foreground cursor-pointer rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="90" className="focus:bg-card focus:text-foreground cursor-pointer rounded-lg">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl bg-card backdrop-blur-xl border-border/80 text-foreground hover:bg-muted hover:text-foreground h-10 transition-all border-dashed">
            <Download className="mr-2 h-4 w-4 text-brand" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: stats?.totalRevenue ? `£${stats.totalRevenue.toLocaleString()}` : "£0", change: "+4.2%", up: true, icon: TrendingUp, color: "brand" },
          { label: "Net Profit", value: stats?.netProfit ? `£${stats.netProfit.toLocaleString()}` : "£0", change: "+2.1%", up: true, icon: Wallet, color: "profit" },
          { label: "Avg Order Value", value: stats?.aov ? `£${stats.aov.toFixed(2)}` : "£0", change: "-1.5%", up: false, icon: ShoppingCart, color: "brand" },
          { label: "Total Orders", value: stats?.totalOrders?.toLocaleString() || "0", change: "+12%", up: true, icon: Package, color: "brand" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden group hover:border-border/80 transition-all duration-500 hover:shadow-glow">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}/10 blur-3xl -mr-16 -mt-16 transition-opacity duration-500 opacity-50 group-hover:opacity-100`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-card border border-border/80 shadow-inner group-hover:border-${stat.color}/30 transition-colors duration-500`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                </div>
                <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-bold ${stat.up ? "bg-profit/10 text-profit border border-profit/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold mt-1 text-foreground tracking-tight">{stat.value}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">vs last period</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-border pb-4 bg-muted/50">
            <CardTitle className="text-foreground">Revenue & Profit Trend</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Monthly comparison of business growth</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <RevenueTrendChart data={salesData} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-border pb-4 bg-muted/50">
            <CardTitle className="text-foreground">Sales by Category</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Distribution across product lines</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] flex items-center justify-center">
              <CategoryPieChart />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

