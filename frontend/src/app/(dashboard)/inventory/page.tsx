"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Edit, MoreHorizontal, AlertTriangle, Loader2, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [inventoryRes, alertsRes] = await Promise.all([
        fetchApi<any>(`/inventory?skip=0&take=50${search ? `&search=${search}` : ""}`),
        fetchApi<any[]>("/inventory/alerts"),
      ]);
      setItems(inventoryRes.items || []);
      setTotal(inventoryRes.total || 0);
      setAlerts(alertsRes || []);
    } catch (error: any) {
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleStockUpdate = async (id: string, quantity: number) => {
    try {
      await fetchApi(`/inventory/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      toast.success("Stock updated");
      loadInventory();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Real-time stock monitoring and catalog management</p>
        </div>
        <Button size="lg" className="rounded-xl bg-gradient-to-r from-brand to-blue-400 text-foreground border-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:translate-y-[-2px] transition-all duration-300 px-8">
          <Plus className="mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>

      {alerts.length > 0 && (
        <Card className="group relative overflow-hidden bg-card backdrop-blur-xl border border-warning/30 rounded-2xl shadow-2xl shadow-warning/10">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-warning-500 to-warning-600" />
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <AlertTriangle className="h-32 w-32 text-warning-500 rotate-12" />
          </div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center gap-2 text-warning-400 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-warning-500/10 border border-warning-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Low Stock Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-3">
              {alerts.map((item) => (
                <Badge key={item.id} variant="outline" className="bg-warning-500/5 text-warning-400 border-warning-500/20 px-4 py-1.5 rounded-xl hover:bg-warning-500/10 transition-colors">
                  <span className="font-semibold">{item.name}</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span className="text-xs">{item.quantity} remaining</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#0A0F1C] backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-6 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <Input 
                  placeholder="Search catalog by name, SKU, or tag..." 
                  className="pl-11 h-12 rounded-xl bg-card border-border/80 text-foreground placeholder:text-slate-500 focus-visible:ring-brand/50 transition-all" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-all shadow-lg">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="text-muted-foreground text-sm font-medium">Fetching Inventory...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-muted-foreground font-medium">No inventory items found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold h-14">Product</TableHead>
                    <TableHead className="text-muted-foreground font-semibold h-14">SKU</TableHead>
                    <TableHead className="text-muted-foreground font-semibold h-14">Stock</TableHead>
                    <TableHead className="text-muted-foreground font-semibold h-14">Reserved</TableHead>
                    <TableHead className="text-muted-foreground font-semibold h-14">Available</TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold h-14">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const available = item.quantity - (item.reservedQuantity || 0);
                    const isLow = item.quantity <= item.lowStockThreshold;
                    return (
                      <TableRow key={item.id} className="border-border hover:bg-white/[0.03] transition-colors group">
                        <TableCell className="py-4">
                          <div className="font-bold text-slate-100 group-hover:text-foreground transition-colors">{item.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Threshold: {item.lowStockThreshold} units</div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isLow ? "text-warning" : "text-foreground"}`}>{item.quantity}</span>
                            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning-400" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.reservedQuantity || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg font-bold border-0 ${available > 10 ? "bg-profit/10 text-profit" : available > 0 ? "bg-warning/10 text-warning" : "bg-red-500/10 text-red-400"}`}>
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0A0F1C]/95 border-border/80 text-foreground rounded-xl shadow-2xl p-1.5 backdrop-blur-xl">
                              <DropdownMenuItem className="hover:bg-card focus:bg-card cursor-pointer rounded-lg px-3 py-2"><Edit className="mr-2 h-4 w-4 text-brand" />Edit Details</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-card focus:bg-card cursor-pointer rounded-lg px-3 py-2 text-brand" onClick={() => handleStockUpdate(item.id, item.quantity + 1)}>
                                <Plus className="mr-2 h-4 w-4" />Update Stock
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

