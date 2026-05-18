"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface ListingSpecificsTabProps {
  listingId: string;
  specifics: any[];
  onSpecificsChange: () => void;
}

export function ListingSpecificsTab({ listingId, specifics, onSpecificsChange }: ListingSpecificsTabProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setIsAdding(true);
    try {
      await fetchApi(`/listings/${listingId}/specifics`, {
        method: "POST",
        body: JSON.stringify({ key: newKey.trim(), value: newValue.trim() }),
      });
      setNewKey("");
      setNewValue("");
      toast.success("Specific added");
      onSpecificsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to add specific");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete "${key}"?`)) return;
    try {
      await fetchApi(`/listings/${listingId}/specifics?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      toast.success("Specific deleted");
      onSpecificsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleUpdate = async (key: string) => {
    try {
      await fetchApi(`/listings/${listingId}/specifics`, {
        method: "POST",
        body: JSON.stringify({ key, value: editValue.trim() }),
      });
      setEditingId(null);
      toast.success("Specific updated");
      onSpecificsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  const getValueTypeColor = (type: string) => {
    switch (type) {
      case "compatibility": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "list": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "number": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "boolean": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Add Item Specific</CardTitle>
          <CardDescription>Key-value pairs for eBay item specifics (Brand, Size, Colour, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Key (e.g. Brand)"
              className="rounded-xl w-48"
            />
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value (e.g. Nike)"
              className="rounded-xl flex-1"
            />
            <Button onClick={handleAdd} disabled={isAdding || !newKey.trim() || !newValue.trim()} className="rounded-xl">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Item Specifics ({specifics.length})</CardTitle>
          <CardDescription>Click on a value to edit it</CardDescription>
        </CardHeader>
        <CardContent>
          {specifics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No item specifics yet</p>
              <p className="text-sm text-muted-foreground">Add specifics above to improve your listing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {specifics.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-40 shrink-0">
                    <span className="text-sm font-medium">{spec.key}</span>
                    <Badge variant="outline" className={`ml-2 text-xs ${getValueTypeColor(spec.valueType)}`}>
                      {spec.valueType}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    {editingId === spec.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="rounded-lg h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(spec.key);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button size="sm" onClick={() => handleUpdate(spec.key)} className="h-8 rounded-lg">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 rounded-lg">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          setEditingId(spec.id);
                          setEditValue(spec.value);
                        }}
                      >
                        {spec.value}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(spec.key)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-600 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
