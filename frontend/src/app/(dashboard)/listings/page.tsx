"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Zap,
  RefreshCw,
  MoreHorizontal,
  ArrowUpDown,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Upload,
  Sparkles,
  Package,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-profit/10 text-profit border-profit/20",
  DRAFT: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
  ENDED: "bg-red-500/10 text-red-400 border-red-500/20",
  OUT_OF_STOCK: "bg-warning/10 text-warning border-warning/20",
  SCHEDULED: "bg-brand/10 text-brand border-brand/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [take] = useState(50);
  const [activeTab, setActiveTab] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkValue, setBulkValue] = useState("");

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * take).toString(),
        take: take.toString(),
        ...(search ? { search } : {}),
        ...(activeTab !== "all" ? { status: activeTab } : {}),
        sortBy,
        sortOrder,
      });
      const res = await fetchApi<any>(`/listings?${params}`);
      setListings(res.items || []);
      setTotal(res.total || 0);
    } catch (error: any) {
      toast.error("Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }, [page, take, search, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetchApi("/ebay/sync?action=full-sync", { method: "POST" });
      toast.success("Full sync started");
      loadListings();
    } catch (error: any) {
      toast.error(error.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await fetchApi(`/listings/${id}`, { method: "DELETE" });
      toast.success("Listing deleted");
      loadListings();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedIds.size === 0) return;
    try {
      await fetchApi("/listings/bulk", {
        method: "POST",
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
          data: value ? { [action === "update" ? Object.keys(value)[0] : action.replace("update-", "")]: value?.[Object.keys(value)[0]] || value } : undefined,
        }),
      });
      toast.success(`Bulk ${action} completed for ${selectedIds.size} listings`);
      setSelectedIds(new Set());
      setBulkAction(null);
      setBulkValue("");
      loadListings();
    } catch (error: any) {
      toast.error(error.message || "Bulk action failed");
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalPages = Math.ceil(total / take);
  const allSelected = listings.length > 0 && selectedIds.size === listings.length;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Listings</h1>
          <p className="text-muted-foreground mt-1">{total.toLocaleString()} total listings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl bg-card border-border/80 text-foreground hover:bg-muted hover:text-foreground h-10 transition-all" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand" /> : <RefreshCw className="mr-2 h-4 w-4 text-brand" />}
            Sync from eBay
          </Button>
          <Link href="/listings/new">
            <Button className="rounded-xl bg-gradient-primary text-foreground shadow-glow hover:opacity-90 h-10 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-brand/10 border-brand/20 shadow-glow">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-brand">{selectedIds.size} listing{selectedIds.size > 1 ? "s" : ""} selected</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-lg h-8 bg-card border-border/80 text-foreground hover:bg-muted hover:text-foreground" onClick={() => handleBulkAction("update-price", { price: parseFloat(bulkValue) })}>
                Set Price
              </Button>
              <Input
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Value..."
                className="w-24 h-8 rounded-lg bg-muted/50 border-border/80 text-foreground placeholder:text-muted-foreground"
              />
              <Button size="sm" variant="outline" className="rounded-lg h-8 bg-card border-border/80 text-foreground hover:bg-muted hover:text-foreground" onClick={() => handleBulkAction("update-quantity", { quantity: parseInt(bulkValue) })}>
                Set Qty
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg h-8 bg-card border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleBulkAction("delete")}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-foreground hover:bg-card" onClick={() => { setSelectedIds(new Set()); setBulkAction(null); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="rounded-xl bg-card border border-border p-1.5 h-auto backdrop-blur-xl shadow-inner">
            <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground transition-all font-bold">All ({total})</TabsTrigger>
            <TabsTrigger value="ACTIVE" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground transition-all font-bold">Active</TabsTrigger>
            <TabsTrigger value="DRAFT" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground transition-all font-bold">Draft</TabsTrigger>
            <TabsTrigger value="OUT_OF_STOCK" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-brand data-[state=active]:text-foreground data-[state=active]:shadow-glow-sm text-muted-foreground hover:text-foreground transition-all font-bold">Issues</TabsTrigger>
          </TabsList>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand transition-all" />
              <Input
                placeholder="Search listings..."
                className="pl-10 rounded-xl bg-card border-border/80 text-foreground placeholder:text-slate-500 focus:border-brand/50 focus:ring-brand/20 h-11 w-full sm:w-72 backdrop-blur-md transition-all shadow-inner"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 h-11 w-11 transition-all backdrop-blur-md">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-8">
          <Card className="bg-[#0A0F1C] backdrop-blur-xl border-border shadow-2xl rounded-2xl overflow-hidden group">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                  <p className="text-muted-foreground font-bold tracking-wide">FETCHING LISTINGS...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-6">
                    <Package className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="text-foreground font-bold text-xl tracking-tight">No listings found</h3>
                  <p className="text-muted-foreground text-sm mt-2 mb-8 max-w-sm">Start your journey by creating a new listing or syncing your existing catalog from eBay.</p>
                  <Link href="/listings/new">
                    <Button className="rounded-xl bg-gradient-primary text-foreground shadow-glow hover:scale-105 transition-all h-12 px-8 font-bold border-0">
                      <Plus className="mr-2 h-5 w-5" /> Create Listing
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 border-b border-border">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="w-14 pl-6">
                            <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand rounded" />
                          </TableHead>
                          <TableHead className="w-[40%] text-muted-foreground h-14">
                            <button className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors" onClick={() => handleSort("title")}>
                              Product <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="text-muted-foreground font-bold h-14 uppercase text-[11px] tracking-widest">SKU</TableHead>
                          <TableHead className="text-muted-foreground h-14">
                            <button className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors uppercase text-[11px] tracking-widest" onClick={() => handleSort("price")}>
                              Price <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="text-muted-foreground h-14">
                            <button className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors uppercase text-[11px] tracking-widest" onClick={() => handleSort("quantity")}>
                              Stock <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="text-muted-foreground font-bold h-14 uppercase text-[11px] tracking-widest">Status</TableHead>
                          <TableHead className="text-muted-foreground font-bold h-14 uppercase text-[11px] tracking-widest">AI Score</TableHead>
                          <TableHead className="text-right text-muted-foreground font-bold h-14 pr-6 uppercase text-[11px] tracking-widest">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <TableRow key={listing.id} className={`border-border transition-all duration-300 ${selectedIds.has(listing.id) ? "bg-brand/10 border-brand/20" : "hover:bg-white/[0.03] group/row"}`}>
                            <TableCell className="pl-6">
                              <Checkbox
                                checked={selectedIds.has(listing.id)}
                                onCheckedChange={(checked) => handleSelect(listing.id, checked as boolean)}
                                className="border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand rounded"
                              />
                            </TableCell>
                            <TableCell className="py-5">
                              <Link href={`/listings/${listing.id}`} className="flex items-center gap-4 group/item">
                                <div className="relative shrink-0 overflow-hidden rounded-xl border border-border/80 group-hover/item:border-brand/50 transition-colors">
                                  {listing.primaryImage ? (
                                    <img src={listing.primaryImage} alt="" className="w-12 h-12 object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <div className="w-12 h-12 bg-card flex items-center justify-center group-hover/item:bg-muted transition-colors">
                                      <Package className="h-6 w-6 text-slate-500" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/60 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-100 group-hover/row:text-foreground transition-colors truncate max-w-[320px] leading-tight">{listing.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-card text-muted-foreground font-mono tracking-tight border border-border uppercase">
                                      {listing.ebayAccount?.username || "Global"}
                                    </span>
                                    {listing.ebayAccount?.isSandbox && (
                                      <span className="text-[10px] font-bold text-amber-500 tracking-wider">SANDBOX</span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground group-hover/row:text-foreground/90 transition-colors">{listing.sku || "-"}</TableCell>
                            <TableCell className="font-bold text-foreground text-base tracking-tight">£{Number(listing.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${listing.quantity <= 5 ? "text-warning shadow-glow shadow-warning/10" : "text-foreground"}`}>{listing.quantity}</span>
                                {listing.quantity <= 5 && <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`rounded-lg px-3 py-1 font-bold text-[10px] tracking-widest uppercase border ${statusColors[listing.status] || "bg-card text-muted-foreground border-border/80"}`}>
                                {listing.status.toLowerCase().replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 w-20 h-2 bg-card rounded-full overflow-hidden border border-border p-[1px]">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${listing.aiScore >= 90 ? "bg-gradient-to-r from-profit to-emerald-400 shadow-glow shadow-profit/40" : listing.aiScore >= 75 ? "bg-gradient-to-r from-brand to-cyan-400 shadow-glow shadow-brand/40" : "bg-gradient-to-r from-warning to-amber-400"}`}
                                    style={{ width: `${listing.aiScore || 0}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${listing.aiScore >= 90 ? "text-profit" : listing.aiScore >= 75 ? "text-brand" : "text-warning"}`}>{listing.aiScore || "-"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all shadow-inner">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0A0F1C]/95 border-border/80 text-foreground/90 shadow-2xl rounded-2xl p-1.5 backdrop-blur-xl min-w-[180px]">
                                  <DropdownMenuItem asChild className="focus:bg-card focus:text-foreground cursor-pointer rounded-xl px-3 py-2.5 transition-colors">
                                    <Link href={`/listings/${listing.id}`}><Eye className="mr-3 h-4 w-4 text-brand" />View & Edit</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleBulkAction("update", { title: listing.title })} className="focus:bg-card focus:text-foreground cursor-pointer rounded-xl px-3 py-2.5 transition-colors"><Edit className="mr-3 h-4 w-4 text-muted-foreground" />Edit Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    fetchApi(`/listings/${listing.id}/actions?action=generate-description`, { method: "POST" })
                                      .then(() => { toast.success("AI description generated"); loadListings(); })
                                      .catch((e) => toast.error(e.message));
                                  }} className="focus:bg-brand/10 focus:text-brand cursor-pointer rounded-xl px-3 py-2.5 transition-colors group/ai">
                                    <Sparkles className="mr-3 h-4 w-4 text-brand group-hover/ai:animate-pulse" />AI Optimize
                                  </DropdownMenuItem>
                                  {listing.status === "DRAFT" && (
                                    <DropdownMenuItem onClick={() => {
                                      fetchApi(`/listings/${listing.id}/actions?action=publish`, { method: "POST" })
                                        .then(() => { toast.success("Published to eBay"); loadListings(); })
                                        .catch((e) => toast.error(e.message));
                                    }} className="focus:bg-profit/10 focus:text-profit cursor-pointer rounded-xl px-3 py-2.5 transition-colors"><Zap className="mr-3 h-4 w-4 text-profit" />Publish to eBay</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-card mx-2 my-1.5" />
                                  <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer rounded-xl px-3 py-2.5 transition-colors" onClick={() => handleDelete(listing.id)}>
                                    <Trash2 className="mr-3 h-4 w-4" />Delete Listing
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-5 border-t border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground font-medium">
                      Showing <span className="text-foreground">{(page - 1) * take + 1}</span> to <span className="text-foreground">{Math.min(page * take, total)}</span> of <span className="text-foreground font-bold">{total.toLocaleString()}</span> listings
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 backdrop-blur-md" onClick={() => setPage(1)} disabled={page === 1}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 backdrop-blur-md" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center px-4 h-9 rounded-xl bg-muted/50 border border-border text-xs font-bold text-foreground/90">
                        PAGE {page} OF {totalPages || 1}
                      </div>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 backdrop-blur-md" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30 backdrop-blur-md" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

