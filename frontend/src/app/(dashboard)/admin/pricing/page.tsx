"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Edit2, Save, X, Check } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try { const data = await adminApi.pricing.list(undefined, true); setPlans(data); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await adminApi.pricing.update(editing.id, { ...editing, features: typeof editing.features === 'string' ? editing.features.split('\n').filter((f: string) => f.trim()) : editing.features });
      toast.success("Saved"); setEditing(null); loadPlans();
    } catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <PageSkeleton content="cards" />;

  const monthly = plans.filter(p => p.period === "monthly");
  const yearly = plans.filter(p => p.period === "yearly");

  const renderPlans = (periodPlans: any[]) => (
    <div className="grid grid-cols-3 gap-6">
      {periodPlans.map(plan => (
        <Card key={plan.id} className={!plan.isActive ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-2xl font-bold mt-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing({ ...plan, features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features })}><Edit2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            <ul className="space-y-1">
              {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{f}</li>
              ))}
            </ul>
            {plan.isPopular && <Badge className="mt-3">Most Popular</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
        <p className="text-muted-foreground mt-1">Edit pricing plans, features, and pricing.</p>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>Edit Plan: {editing.name} ({editing.period})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Price</Label><Input value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Features (one per line)</Label><Textarea value={editing.features} onChange={(e) => setEditing({ ...editing, features: e.target.value })} rows={6} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>CTA Text</Label><Input value={editing.ctaText} onChange={(e) => setEditing({ ...editing, ctaText: e.target.value })} /></div>
              <div className="space-y-2"><Label>CTA Link</Label><Input value={editing.ctaLink} onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })} /></div>
              <div className="flex items-end"><Badge variant={editing.isPopular ? "default" : "secondary"} className="cursor-pointer" onClick={() => setEditing({ ...editing, isPopular: !editing.isPopular })}>{editing.isPopular ? "Popular" : "Not Popular"}</Badge></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monthly">
        <TabsList><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="yearly">Yearly</TabsTrigger></TabsList>
        <TabsContent value="monthly">{renderPlans(monthly)}</TabsContent>
        <TabsContent value="yearly">{renderPlans(yearly)}</TabsContent>
      </Tabs>
    </div>
  );
}
