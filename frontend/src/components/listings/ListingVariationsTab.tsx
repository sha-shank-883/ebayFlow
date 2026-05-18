"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Palette } from "lucide-react";
import toast from "react-hot-toast";

interface ListingVariationsTabProps {
  listingId: string;
  variations: any[];
  onVariationsChange: () => void;
}

export function ListingVariationsTab({ listingId, variations, onVariationsChange }: ListingVariationsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    price: "",
    quantity: "",
    specifics: "",
  });

  const handleAdd = async () => {
    if (!formData.price || !formData.quantity) return;
    setIsAdding(true);
    try {
      const specifics: Record<string, string> = {};
      if (formData.specifics.trim()) {
        formData.specifics.split(",").forEach((pair) => {
          const [key, ...valueParts] = pair.split(":");
          if (key && valueParts.length) {
            specifics[key.trim()] = valueParts.join(":").trim();
          }
        });
      }

      await fetchApi(`/listings/${listingId}/variations`, {
        method: "POST",
        body: JSON.stringify({
          sku: formData.sku || undefined,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          specifics: Object.keys(specifics).length > 0 ? specifics : undefined,
        }),
      });

      setFormData({ sku: "", price: "", quantity: "", specifics: "" });
      setShowAddForm(false);
      toast.success("Variation added");
      onVariationsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to add variation");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (variationId: string) => {
    if (!confirm("Delete this variation?")) return;
    try {
      await fetchApi(`/listings/${listingId}/variations?variationId=${variationId}`, { method: "DELETE" });
      toast.success("Variation deleted");
      onVariationsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const getSpecificsDisplay = (specifics: Record<string, string> | null) => {
    if (!specifics || Object.keys(specifics).length === 0) return null;
    return Object.entries(specifics).map(([key, value]) => (
      <Badge key={key} variant="outline" className="text-xs">
        {key}: {value}
      </Badge>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Variations</h3>
          <p className="text-sm text-muted-foreground">Manage size, colour, and other variation options</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Variation
        </Button>
      </div>

      {showAddForm && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>New Variation</CardTitle>
            <CardDescription>Add specifics as comma-separated key:value pairs (e.g. Size:Large, Colour:Red)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="TSHIRT-BLK-L"
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (£) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Specifics</label>
                <Input
                  value={formData.specifics}
                  onChange={(e) => setFormData({ ...formData, specifics: e.target.value })}
                  placeholder="Size:L, Colour:Red"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isAdding || !formData.price || !formData.quantity} className="rounded-xl">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Variation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {variations.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No variations yet</p>
            <p className="text-sm text-muted-foreground">Add variations for multi-SKU listings</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">SKU</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Specifics</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Price</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Quantity</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Sold</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variations.map((variation) => (
                <tr key={variation.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{variation.sku || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getSpecificsDisplay(variation.specifics) || <span className="text-muted-foreground text-sm">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">£{Number(variation.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={variation.quantity <= 5 ? "text-amber-600 font-medium" : ""}>{variation.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{variation.quantitySold}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(variation.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Delete variation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
