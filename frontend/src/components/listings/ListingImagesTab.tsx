"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Loader2, Image as ImageIcon, Star } from "lucide-react";
import toast from "react-hot-toast";

interface ListingImagesTabProps {
  listingId: string;
  images: any[];
  onImagesChange: () => void;
}

export function ListingImagesTab({ listingId, images, onImagesChange }: ListingImagesTabProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setIsAdding(true);
    try {
      await fetchApi(`/listings/${listingId}/images`, {
        method: "POST",
        body: JSON.stringify({ imageUrl: newImageUrl }),
      });
      setNewImageUrl("");
      toast.success("Image added");
      onImagesChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to add image");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await fetchApi(`/listings/${listingId}/images?imageId=${imageId}`, { method: "DELETE" });
      toast.success("Image deleted");
      onImagesChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
      const imageIds = sortedImages.map((img) => img.id);
      const index = imageIds.indexOf(imageId);
      imageIds.splice(index, 1);
      imageIds.unshift(imageId);

      await fetchApi(`/listings/${listingId}/images`, {
        method: "PATCH",
        body: JSON.stringify({ imageIds }),
      });
      toast.success("Primary image updated");
      onImagesChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const [draggedItem] = sortedImages.splice(draggedIndex, 1);
    sortedImages.splice(dropIndex, 0, draggedItem);

    const imageIds = sortedImages.map((img) => img.id);

    try {
      await fetchApi(`/listings/${listingId}/images`, {
        method: "PATCH",
        body: JSON.stringify({ imageIds }),
      });
      toast.success("Images reordered");
      onImagesChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder");
    }

    setDraggedIndex(null);
  };

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Add Image</CardTitle>
          <CardDescription>Add an image URL from eBay or your CDN</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://i.ebayimg.com/images/..."
              className="rounded-xl flex-1"
            />
            <Button onClick={handleAddImage} disabled={isAdding || !newImageUrl.trim()} className="rounded-xl">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Images ({sortedImages.length})</CardTitle>
          <CardDescription>Drag to reorder. First image is the primary.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No images yet</p>
              <p className="text-sm text-muted-foreground">Add image URLs above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedImages.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`group relative rounded-xl border-2 overflow-hidden transition-all ${
                    image.isPrimary ? "border-primary ring-2 ring-primary/20" : "border-muted"
                  } ${draggedIndex === index ? "opacity-50" : ""}`}
                >
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={image.ebayImageUrl}
                      alt={image.altText || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSetPrimary(image.id)}
                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                        title="Set as primary"
                      >
                        <Star className={`h-3.5 w-3.5 ${image.isPrimary ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-600"
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-white cursor-grab" />
                      <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {image.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                        Primary
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
