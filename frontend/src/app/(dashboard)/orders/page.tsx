"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, Eye, MoreHorizontal, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  PENDING: { label: "Pending", icon: Clock, color: "bg-warning/10 text-warning border-warning/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]" },
  PAYMENT_RECEIVED: { label: "Payment Received", icon: Package, color: "bg-info/10 text-info border-info/20 shadow-[0_0_12px_rgba(14,165,233,0.1)]" },
  PROCESSING: { label: "Processing", icon: Package, color: "bg-info/10 text-info border-info/20 shadow-[0_0_12px_rgba(14,165,233,0.1)]" },
  SHIPPED: { label: "Shipped", icon: Truck, color: "bg-brand-500/10 text-brand-400 border-brand-500/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]" },
  DELIVERED: { label: "Delivered", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]" },
  CANCELLED: { label: "Cancelled", icon: AlertCircle, color: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        skip: "0",
        take: "50",
        ...(search ? { search } : {}),
        ...(activeTab !== "all" ? { status: activeTab } : {}),
      });
      const res = await fetchApi<any>(`/orders?${params}`);
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (error: any) {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetchApi("/orders/sync", { method: "POST" });
      toast.success("Order sync started");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetchApi(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Order marked as ${status}`);
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground">Track and manage your eBay orders</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl bg-card backdrop-blur-xl border border-border/80 text-foreground hover:bg-muted" onClick={handleSync} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Orders
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending", count: statusCounts["PENDING"] || 0, icon: Clock, color: "text-warning", glow: "group-hover:shadow-warning/20" },
          { label: "Processing", count: statusCounts["PROCESSING"] || 0, icon: Package, color: "text-info", glow: "group-hover:shadow-info/20" },
          { label: "Shipped", count: statusCounts["SHIPPED"] || 0, icon: Truck, color: "text-brand-400", glow: "group-hover:shadow-brand-500/20" },
          { label: "Delivered", count: statusCounts["DELIVERED"] || 0, icon: CheckCircle, color: "text-emerald-400", glow: "group-hover:shadow-emerald-500/20" },
        ].map((stat) => (
          <Card key={stat.label} className={`group relative overflow-hidden bg-card backdrop-blur-xl border border-border rounded-2xl transition-all duration-300 hover:border-border/80 hover:translate-y-[-2px] shadow-xl ${stat.glow}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className={`p-3 rounded-xl bg-card border border-border ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0A0F1C] backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-5 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search orders by ID or buyer..." 
                className="pl-10 h-11 rounded-xl bg-card border-border/80 text-foreground placeholder:text-slate-500 focus-visible:ring-brand/50 transition-all" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <TabsList className="rounded-xl bg-card border border-border/80 p-1 h-11">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground rounded-lg px-5 transition-all" 
                onClick={() => setActiveTab("all")}
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="PENDING" 
                className="data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground rounded-lg px-5 transition-all" 
                onClick={() => setActiveTab("PENDING")}
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="SHIPPED" 
                className="data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground rounded-lg px-5 transition-all" 
                onClick={() => setActiveTab("SHIPPED")}
              >
                Shipped
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-semibold h-12">Order ID</TableHead>
                  <TableHead className="text-muted-foreground font-semibold h-12">Buyer</TableHead>
                  <TableHead className="text-muted-foreground font-semibold h-12">Total</TableHead>
                  <TableHead className="text-muted-foreground font-semibold h-12">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold h-12">Date</TableHead>
                  <TableHead className="text-right text-muted-foreground font-semibold h-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-border">
                {orders.map((order) => {
                  const config = statusConfig[order.status] || { label: order.status, icon: Clock, color: "bg-card text-foreground/90 border-border/80" };
                  const Icon = config.icon;
                  return (
                    <TableRow key={order.id} className="border-border hover:bg-white/[0.03] transition-colors">
                      <TableCell className="font-medium text-slate-100">{order.ebayOrderId}</TableCell>
                      <TableCell className="text-sm text-foreground/90">{order.buyerUsername}</TableCell>
                      <TableCell className="font-medium text-foreground">£{Number(order.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0A0F1C]/95 border-border/80 text-foreground rounded-xl shadow-xl backdrop-blur-xl">
                            <DropdownMenuItem className="hover:bg-card focus:bg-card cursor-pointer rounded-lg m-1"><Eye className="mr-2 h-4 w-4 text-brand" />View Details</DropdownMenuItem>
                            {order.status === "PENDING" && (
                              <DropdownMenuItem className="hover:bg-card focus:bg-card cursor-pointer rounded-lg m-1" onClick={() => handleStatusUpdate(order.id, "SHIPPED")}>
                                <Truck className="mr-2 h-4 w-4" />Mark Shipped
                              </DropdownMenuItem>
                            )}
                            {order.status === "SHIPPED" && (
                              <DropdownMenuItem className="hover:bg-card focus:bg-card cursor-pointer rounded-lg m-1" onClick={() => handleStatusUpdate(order.id, "DELIVERED")}>
                                <CheckCircle className="mr-2 h-4 w-4" />Mark Delivered
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

