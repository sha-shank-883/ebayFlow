"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Save, Zap, Eye, Loader2, Plus, Trash2, GripVertical,
  Image as ImageIcon, FileText, Layers, Palette, History, Sparkles,
  CheckCircle, AlertCircle, Clock
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ListingDetailsTab } from "@/components/listings/ListingDetailsTab";
import { ListingImagesTab } from "@/components/listings/ListingImagesTab";
import { ListingSpecificsTab } from "@/components/listings/ListingSpecificsTab";
import { ListingVariationsTab } from "@/components/listings/ListingVariationsTab";
import { ListingHtmlTab } from "@/components/listings/ListingHtmlTab";
import { ListingSeoTab } from "@/components/listings/ListingSeoTab";
import { ListingHistoryTab } from "@/components/listings/ListingHistoryTab";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  ENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  OUT_OF_STOCK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PENDING_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const loadListing = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<any>(`/listings/${listingId}`);
      setListing(data);
      setFormData({
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        descriptionHtml: data.descriptionHtml || data.description || "",
        price: data.price?.toString() || "0",
        originalPrice: data.originalPrice?.toString() || "",
        buyItNowPrice: data.buyItNowPrice?.toString() || "",
        quantity: data.quantity?.toString() || "0",
        sku: data.sku || "",
        categoryId: data.categoryId || "",
        categoryName: data.categoryName || "",
        condition: data.condition || "",
        format: data.format || "FIXED_PRICE",
        tags: data.tags || [],
      });
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast.error("Failed to load listing");
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data: any = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        descriptionHtml: formData.descriptionHtml || undefined,
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        buyItNowPrice: formData.buyItNowPrice ? parseFloat(formData.buyItNowPrice) : undefined,
        quantity: parseInt(formData.quantity) || 0,
        sku: formData.sku || undefined,
        categoryId: formData.categoryId || undefined,
        categoryName: formData.categoryName || undefined,
        condition: formData.condition || undefined,
        format: formData.format || "FIXED_PRICE",
      };

      const updated = await fetchApi<any>(`/listings/${listingId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      setListing(updated);
      setHasUnsavedChanges(false);
      toast.success("Listing saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Publish this listing to eBay? This cannot be undone.")) return;
    setIsPublishing(true);
    try {
      await fetchApi<any>(`/listings/${listingId}/actions?action=publish`, { method: "POST" });
      toast.success("Listing published to eBay");
      loadListing();
    } catch (error: any) {
      toast.error(error.message || "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAiOptimize = async () => {
    try {
      await fetchApi<any>(`/listings/${listingId}/actions?action=generate-description`, { method: "POST" });
      toast.success("AI description generated");
      loadListing();
    } catch (error: any) {
      toast.error(error.message || "AI optimization failed");
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Listing not found</h2>
        <Link href="/listings">
          <Button variant="outline" className="mt-4">Back to Listings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/listings">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate max-w-md">{listing.title}</h1>
              <Badge variant="outline" className={statusColors[listing.status] || "bg-muted text-muted-foreground"}>
                {listing.status.toLowerCase().replace("_", " ")}
              </Badge>
              {listing.isDraft && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Draft
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {listing.ebayAccount?.username} {listing.ebayAccount?.isSandbox ? "(Sandbox)" : ""}
              {listing.sku && ` • SKU: ${listing.sku}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Unsaved changes
            </span>
          )}
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleAiOptimize}>
            <Sparkles className="mr-2 h-4 w-4" /> AI Optimize
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          {listing.status === "DRAFT" && (
            <Button size="sm" className="rounded-xl bg-gradient-primary text-white" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Publish to eBay
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="details" className="rounded-lg gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Details
          </TabsTrigger>
          <TabsTrigger value="images" className="rounded-lg gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Images ({listing.imagesList?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="specifics" className="rounded-lg gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Specifics ({listing.specifics?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="variations" className="rounded-lg gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Variations ({listing.variationsList?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="html" className="rounded-lg gap-1.5">
            <Eye className="h-3.5 w-3.5" /> HTML
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-1.5">
            <History className="h-3.5 w-3.5" /> History ({listing.revisions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <ListingDetailsTab
            formData={formData}
            updateField={updateField}
            listing={listing}
          />
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <ListingImagesTab
            listingId={listingId}
            images={listing.imagesList || []}
            onImagesChange={loadListing}
          />
        </TabsContent>

        <TabsContent value="specifics" className="mt-4">
          <ListingSpecificsTab
            listingId={listingId}
            specifics={listing.specifics || []}
            onSpecificsChange={loadListing}
          />
        </TabsContent>

        <TabsContent value="variations" className="mt-4">
          <ListingVariationsTab
            listingId={listingId}
            variations={listing.variationsList || []}
            onVariationsChange={loadListing}
          />
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          <ListingHtmlTab
            formData={formData}
            updateField={updateField}
            listing={listing}
          />
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <ListingSeoTab
            listing={listing}
            formData={formData}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ListingHistoryTab
            listingId={listingId}
            revisions={listing.revisions || []}
            onRollback={loadListing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
