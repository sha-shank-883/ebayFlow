"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Mail, Bell, Shield, Link2, Trash2, Check, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [ebayAccounts, setEbayAccounts] = useState<any[]>([]);
  const [isLoadingEbay, setIsLoadingEbay] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) toast.success("eBay account connected successfully!");
    if (error === "ebay_auth_failed") toast.error("eBay connection failed. Please try again.");
    if (error === "ebay_auth_denied") toast.error("eBay connection was cancelled.");
  }, [searchParams]);

  useEffect(() => {
    loadEbayAccounts();
  }, []);

  const loadEbayAccounts = async () => {
    try {
      const accounts = await fetchApi<any[]>("/ebay/accounts");
      setEbayAccounts(accounts || []);
    } catch (error) {
      console.error("Failed to load eBay accounts:", error);
    } finally {
      setIsLoadingEbay(false);
    }
  };

  const handleConnectEbay = async () => {
    try {
      const result = await fetchApi<{ authUrl: string }>("/ebay/auth-url");
      if (result?.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast.error("Failed to get eBay authorization URL");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect eBay");
    }
  };

  const handleSyncEbay = async (accountId: string) => {
    setSyncing(accountId);
    try {
      await fetchApi(`/ebay/accounts/${accountId}/sync`, { method: "POST" });
      toast.success("Sync started");
      loadEbayAccounts();
    } catch (error: any) {
      toast.error(error.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnectEbay = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this eBay account?")) return;
    try {
      await fetchApi(`/ebay/accounts/${accountId}`, { method: "DELETE" });
      toast.success("eBay account disconnected");
      loadEbayAccounts();
    } catch (error: any) {
      toast.error(error.message || "Disconnect failed");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Settings saved successfully!");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and business integrations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/[0.03] backdrop-blur-xl border border-border p-1 rounded-xl">
          <TabsTrigger value="profile" className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg transition-all duration-300 px-6">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg transition-all duration-300 px-6">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg transition-all duration-300 px-6">Security</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-brand data-[state=active]:text-foreground text-muted-foreground rounded-lg transition-all duration-300 px-6">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 outline-none">
          <Card className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-3xl -mr-32 -mt-32" />
            <CardHeader className="border-b border-border pb-4 bg-muted/50">
              <CardTitle className="text-foreground">Profile Information</CardTitle>
              <CardDescription className="text-muted-foreground">Update your personal details and public profile</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-border/80 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-brand to-brand/60 text-foreground text-3xl font-bold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="rounded-xl bg-card border-border/80 text-foreground hover:bg-muted h-9">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/90 text-sm">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} className="h-11 rounded-xl bg-card border-border/80 text-foreground placeholder:text-slate-600 focus:ring-brand/50 focus:border-brand/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/90 text-sm">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} className="h-11 rounded-xl bg-card border-border/80 text-foreground placeholder:text-slate-600 focus:ring-brand/50 focus:border-brand/50" />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-brand text-foreground hover:bg-brand/90 px-8 h-11 shadow-lg shadow-brand/20 transition-all active:scale-95">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 outline-none">
          <Card className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden">
            <CardHeader className="border-b border-border pb-4 bg-muted/50">
              <CardTitle className="text-foreground">Notification Preferences</CardTitle>
              <CardDescription className="text-muted-foreground">Choose what notifications you receive across platform</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              {[
                { label: "New Orders", desc: "Get notified when you receive a new order", defaultChecked: true },
                { label: "Low Stock Alerts", desc: "Alert when inventory falls below threshold", defaultChecked: true },
                { label: "Listing Sync Complete", desc: "Notification when listings are synced to eBay", defaultChecked: false },
                { label: "AI Generation Complete", desc: "When AI finishes generating content", defaultChecked: true },
              ].map((item, index) => (
                <div key={item.label} className={`flex items-center justify-between py-4 ${index !== 3 ? "border-b border-border" : ""}`}>
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-foreground">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} className="data-[state=checked]:bg-brand" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 outline-none">
          <Card className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden">
            <CardHeader className="border-b border-border pb-4 bg-muted/50">
              <CardTitle className="text-foreground">Change Password</CardTitle>
              <CardDescription className="text-muted-foreground">Update your password regularly for better security</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current" className="text-foreground/90 text-sm">Current Password</Label>
                  <Input id="current" type="password" placeholder="••••••••" className="h-11 rounded-xl bg-card border-border/80 text-foreground focus:ring-brand/50 focus:border-brand/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-foreground/90 text-sm">New Password</Label>
                  <Input id="new" type="password" placeholder="••••••••" className="h-11 rounded-xl bg-card border-border/80 text-foreground focus:ring-brand/50 focus:border-brand/50" />
                </div>
              </div>
              <Button className="rounded-xl bg-brand text-foreground hover:bg-brand/90 px-8 h-11 shadow-lg shadow-brand/20 transition-all active:scale-95">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 backdrop-blur-xl border-red-500/20 shadow-2xl overflow-hidden group">
            <CardHeader className="border-b border-border pb-4 bg-red-500/[0.02]">
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-muted-foreground">Sensitive actions that cannot be undone</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-red-500/10 bg-red-500/[0.03] group-hover:bg-red-500/[0.05] transition-colors">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Delete Account</p>
                  <p className="text-sm text-slate-500">Permanently remove all your data and access</p>
                </div>
                <Button variant="destructive" size="sm" className="rounded-xl bg-red-500/80 hover:bg-red-500 text-foreground px-6 h-10 shadow-lg shadow-red-500/20">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Terminate Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 outline-none">
          <Card className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-brand/5 blur-3xl -ml-32 -mt-32" />
            <CardHeader className="border-b border-border pb-4 bg-muted/50">
              <CardTitle className="text-foreground">Active Integrations</CardTitle>
              <CardDescription className="text-muted-foreground">Manage connections to external marketplaces</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              {isLoadingEbay ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                  <p className="text-sm text-slate-500 font-medium">Fetching accounts...</p>
                </div>
              ) : ebayAccounts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
                  <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-border/80">
                    <Link2 className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1">No Marketplace Connected</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[280px] mx-auto">Connect your eBay account to start managing listings and orders automatically.</p>
                  <Button onClick={handleConnectEbay} className="rounded-xl bg-brand text-foreground hover:bg-brand/90 px-8 h-11 shadow-lg shadow-brand/20 transition-all active:scale-95">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect eBay Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ebayAccounts.map((account) => (
                    <div key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border/80 bg-white/[0.03] hover:bg-white/[0.05] transition-all group shadow-inner">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center border border-border/80 shadow-lg group-hover:scale-105 transition-transform">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" alt="eBay" className="w-10" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-lg">{account.username}</p>
                            <Badge className="bg-profit/10 text-profit border-profit/20 rounded-md text-[10px] uppercase tracking-wider">Active</Badge>
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span>{account.storeName || account.marketplace}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>{account.isSandbox ? "Sandbox" : "Production"}</span>
                          </p>
                          {account.lastSyncedAt && (
                            <p className="text-[11px] text-slate-600 italic">Last synced: {new Date(account.lastSyncedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl bg-muted/50 border-border/80 text-foreground hover:bg-brand/20 hover:text-brand hover:border-brand/30 h-10 px-5 transition-all"
                          onClick={() => handleSyncEbay(account.id)}
                          disabled={syncing === account.id}
                        >
                          {syncing === account.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Sync Now
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10 p-0 transition-all"
                          onClick={() => handleDisconnectEbay(account.id)}
                          title="Disconnect Account"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full rounded-2xl bg-muted/50 border-border border-dashed text-muted-foreground hover:text-foreground hover:bg-card py-8 transition-all" onClick={handleConnectEbay}>
                    <Link2 className="mr-2 h-5 w-5" />
                    Connect Another Marketplace Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-xl border-border shadow-2xl relative overflow-hidden">
            <CardHeader className="border-b border-border pb-4 bg-muted/50">
              <CardTitle className="text-foreground">Upcoming Integrations</CardTitle>
              <CardDescription className="text-muted-foreground">Services that will be available soon</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "Amazon", desc: "Global Marketplace", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" },
                  { name: "Shopify", desc: "Ecommerce Engine", icon: "https://upload.wikimedia.org/wikipedia/commons/6/67/Shopify_logo_2018.svg" },
                  { name: "Xero", desc: "Smart Accounting", icon: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Xero_logo.svg" },
                ].map((integration) => (
                  <div key={integration.name} className="p-6 rounded-2xl border border-border bg-muted/30 hover:bg-white/[0.03] transition-all group flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center border border-border mb-4 group-hover:scale-110 transition-transform grayscale opacity-50">
                      <img src={integration.icon} alt={integration.name} className="w-10 h-10 object-contain" />
                    </div>
                    <p className="font-bold text-foreground mb-1">{integration.name}</p>
                    <p className="text-[11px] text-slate-500 mb-4">{integration.desc}</p>
                    <Badge variant="outline" className="border-border/80 text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-muted/50">Coming Soon</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

