"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ListingDetailsTabProps {
  formData: any;
  updateField: (field: string, value: any) => void;
  listing: any;
}

export function ListingDetailsTab({ formData, updateField, listing }: ListingDetailsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Title, subtitle, and SKU for your listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Enter listing title..."
              className="rounded-xl"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">{formData.title.length}/80 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="Optional subtitle..."
              className="rounded-xl"
              maxLength={55}
            />
            <p className="text-xs text-muted-foreground">{formData.subtitle?.length || 0}/55 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="e.g. TSHIRT-BLK-L"
                className="rounded-xl font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={formData.format} onValueChange={(v) => updateField("format", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_PRICE">Buy It Now</SelectItem>
                  <SelectItem value="AUCTION">Auction</SelectItem>
                  <SelectItem value="BEST_OFFER">Best Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Pricing & Stock</CardTitle>
          <CardDescription>Set your price and available quantity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (£) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (£)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => updateField("originalPrice", e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyItNowPrice">Buy It Now (£)</Label>
              <Input
                id="buyItNowPrice"
                type="number"
                step="0.01"
                value={formData.buyItNowPrice}
                onChange={(e) => updateField("buyItNowPrice", e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={parseInt(formData.quantity) <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                  {parseInt(formData.quantity) <= 5 ? "Low Stock" : "In Stock"}
                </Badge>
                {listing.quantitySold > 0 && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    {listing.quantitySold} sold
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Category & Condition</CardTitle>
          <CardDescription>eBay category and item condition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category ID</Label>
              <Input
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                placeholder="e.g. 30120"
                className="rounded-xl font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(v) => updateField("condition", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                  <SelectItem value="For parts or not working">For parts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {listing.viewCount > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{listing.viewCount}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{listing.watchCount}</p>
                <p className="text-xs text-muted-foreground">Watchers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{listing.quantitySold}</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>Plain text description for your listing</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Enter listing description..."
            className="rounded-xl min-h-[200px]"
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}
