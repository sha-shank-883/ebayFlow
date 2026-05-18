"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, ArrowRight, Download, Loader2, Zap, Layout, Star } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success) toast.success("Subscription updated successfully!");
    if (canceled) toast.error("Subscription change was cancelled.");
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subRes, plansRes] = await Promise.all([
          fetchApi<any>("/billing?action=status"),
          fetchApi<any[]>("/billing?action=plans"),
        ]);
        setSubscription(subRes);
        setPlans(plansRes || []);
      } catch (error: any) {
        toast.error("Failed to load billing data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpgrade = async (priceId: string) => {
    try {
      const res = await fetchApi<any>("/billing", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  const planName = subscription?.plan || "STARTER";
  const limits = subscription?.limits || {};
  const planConfig = subscription?.planConfig || { listings: 200, accounts: 1, aiCredits: 50 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and payment methods</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-brand/20 to-[#080D1A] backdrop-blur-xl border border-brand/20 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CreditCard className="h-32 w-32 text-foreground" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-brand-300 text-sm font-semibold tracking-wider uppercase">Current Subscription</p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-foreground">{planName}</h2>
                <Badge className="bg-brand-500/20 text-brand-300 border-brand-500/30 hover:bg-brand-500/30">
                  {subscription?.status === "active" ? "Active" : "Free"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {subscription?.currentPeriodEnd ? `Next billing cycle: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : "No upcoming billing"}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="#plans">
                <Button className="rounded-xl bg-white text-[#080D1A] hover:bg-white/90 font-semibold px-6 shadow-lg shadow-white/10 transition-all hover:scale-105 active:scale-95">
                  Change Plan
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                <Zap className="h-5 w-5 text-brand" />
              </div>
              <div>
                <CardTitle className="text-foreground">AI Credits Usage</CardTitle>
                <CardDescription className="text-muted-foreground">{limits.aiCredits?.used || 0} of {limits.aiCredits?.limit || planConfig.aiCredits} used this month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/90">Monthly Allowance</span>
                <span className="text-foreground font-medium">{Math.round(((limits.aiCredits?.used || 0) / (limits.aiCredits?.limit || planConfig.aiCredits)) * 100)}%</span>
              </div>
              <Progress 
                value={((limits.aiCredits?.used || 0) / (limits.aiCredits?.limit || planConfig.aiCredits)) * 100} 
                className="h-2 bg-card"
              />
            </div>
            <p className="text-xs text-muted-foreground">AI credits reset at the start of every billing cycle.</p>
          </CardContent>
        </Card>

        <Card className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-info/10 border border-info/20">
                <Layout className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-foreground">Listing Usage</CardTitle>
                <CardDescription className="text-muted-foreground">{limits.listings?.used || 0} of {limits.listings?.limit || planConfig.listings} active listings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/90">Active Listings</span>
                <span className="text-foreground font-medium">{Math.round(((limits.listings?.used || 0) / (limits.listings?.limit || planConfig.listings)) * 100)}%</span>
              </div>
              <Progress 
                value={((limits.listings?.used || 0) / (limits.listings?.limit || planConfig.listings)) * 100} 
                className="h-2 bg-card"
              />
            </div>
            <p className="text-xs text-muted-foreground">Upgrade to increase your total allowed listings.</p>
          </CardContent>
        </Card>
      </div>

      <div id="plans" className="pt-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Available Plans</h2>
          <p className="text-muted-foreground">Scale your business with the right toolset</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.name === planName;
            return (
              <Card 
                key={plan.name} 
                className={`relative bg-card backdrop-blur-xl border transition-all duration-300 flex flex-col ${
                  isCurrent 
                    ? "border-brand shadow-[0_0_40px_-15px_rgba(59,130,246,0.4)] scale-[1.02] z-10" 
                    : "border-border hover:border-border/80 hover:bg-white/[0.06] shadow-xl"
                } rounded-3xl overflow-hidden`}
              >
                {isCurrent && (
                  <div className="bg-brand-500 text-foreground text-[10px] font-bold tracking-widest uppercase py-1 px-4 absolute top-4 right-[-30px] rotate-45 w-[150px] text-center shadow-lg">
                    Current
                  </div>
                )}
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                    {plan.name === "PRO" && <Star className="h-5 w-5 text-brand-400 fill-brand-400" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">£{plan.priceMonthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8 flex-1 flex flex-col">
                  <ul className="space-y-4 flex-1">
                    {[
                      { label: `${plan.listings} listings`, icon: Check },
                      { label: `${plan.accounts} eBay accounts`, icon: Check },
                      { label: `${plan.aiCredits} AI credits/month`, icon: Check },
                      { label: "AI Listing Optimizer", icon: Check },
                      { label: "Smart Analytics", icon: Check },
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="p-0.5 rounded-full bg-brand/10">
                          <feature.icon className="h-4 w-4 text-brand" />
                        </div>
                        <span className="text-foreground">{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full rounded-2xl py-6 font-bold transition-all ${
                      isCurrent 
                        ? "bg-card text-muted-foreground cursor-default border border-border/80" 
                        : "bg-gradient-to-r from-brand to-blue-400 text-foreground hover:opacity-90 shadow-lg shadow-brand/20 active:scale-95"
                    }`}
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(`price_${plan.name.toLowerCase()}`)}
                  >
                    {isCurrent ? "Current Plan" : (
                      <>
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

