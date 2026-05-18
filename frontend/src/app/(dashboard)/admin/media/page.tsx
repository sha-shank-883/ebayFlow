"use client";

import { useEffect, useState, useRef } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { SearchFilter, useSearchFilter } from "@/components/ui/search-filter";
import { BulkActionsBar, useBulkActions } from "@/components/ui/bulk-actions";
import { Pagination } from "@/components/ui/pagination";
import { atomicBulkAction } from "@/lib/transaction";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import Image from "next/image";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { filteredItems, searchQuery, setSearchQuery } = useSearchFilter(media, ["name", "alt"]);

  const bulkActions = useBulkActions<typeof media[0]>();

  useEffect(() => { loadMedia(); }, [currentPage]);

  const loadMedia = async () => {
    try { const data = await adminApi.media.list(`?page=${currentPage}&limit=20`, true); setMedia(data.items); setTotalPages(data.pagination.totalPages); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    const fileIds = files.map((f) => f.name + f.size + f.lastModified);

    fileIds.forEach((id) => {
      setUploadingFiles((prev) => ({ ...prev, [id]: 0 }));
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = fileIds[i];

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/admin/media`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) => ({ ...prev, [fileId]: percent }));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed for ${file.name}`));
            }
          };
          xhr.onerror = () => reject(new Error(`Network error uploading ${file.name}`));
          xhr.send(formData);
        });

        toast.success(`Uploaded ${file.name}`);
        setUploadingFiles((prev) => ({ ...prev, [fileId]: 100 }));
      } catch (error: any) {
        toast.error(error.message);
        setUploadingFiles((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    }

    setTimeout(() => {
      setUploadingFiles({});
      loadMedia();
    }, 500);
  };

  const toggleActive = async (id: string) => {
    try { await adminApi.media.toggleActive(id); loadMedia(); toast.success("Updated"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    try { await adminApi.media.delete(id); loadMedia(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  const handleBulkEnable = async () => {
    await bulkActions.enableSelected(async (ids) => {
      const ops = ids.map((id) => async () => {
        const item = media.find((m) => m.id === id);
        if (!item?.isActive) await adminApi.media.toggleActive(id);
      });
      await atomicBulkAction(ops);
      loadMedia();
    });
  };

  const handleBulkDisable = async () => {
    await bulkActions.disableSelected(async (ids) => {
      const ops = ids.map((id) => async () => {
        const item = media.find((m) => m.id === id);
        if (item?.isActive) await adminApi.media.toggleActive(id);
      });
      await atomicBulkAction(ops);
      loadMedia();
    });
  };

  const handleBulkDelete = async () => {
    await bulkActions.deleteSelected(async (ids) => {
      await atomicBulkAction(ids.map((id) => () => adminApi.media.delete(id)));
      loadMedia();
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8" role="main" aria-label="Media library management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Upload and manage images. Stored locally in /public/uploads.</p>
        </div>
      </div>

      <DragDropUpload onFilesSelected={handleFilesSelected} accept="image/*" maxFiles={10} maxSize={10 * 1024 * 1024} />

      {Object.keys(uploadingFiles).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploading...</h3>
          {Object.entries(uploadingFiles).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{fileId}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or alt text..." aria-label="Search media files" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" role="grid" aria-label="Media items grid">
        {filteredItems.map(item => (
          <Card key={item.id} className={`overflow-hidden ${!item.isActive ? 'opacity-50' : ''}`} role="gridcell" aria-label={`Media item: ${item.filename}${item.alt ? `, Alt text: ${item.alt}` : ''}, ${(item.size / 1024).toFixed(0)} KB`}>
            <div className="aspect-square relative bg-muted">
              <img src={item.url} alt={item.alt || item.filename} className="w-full h-full object-cover" />
              {!item.isActive && <div className="absolute inset-0 bg-black/50 flex items-center justify-center" aria-hidden="true"><Badge variant="secondary">Hidden</Badge></div>}
            </div>
            <CardContent className="p-3">
              <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
              <p className="text-xs text-muted-foreground">{(item.size / 1024).toFixed(0)} KB</p>
              <div className="flex gap-1 mt-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleActive(item.id)} aria-label={item.isActive ? "Hide this media item" : "Show this media item"}>{item.isActive ? <EyeOff className="h-3 w-3" aria-hidden="true" /> : <Eye className="h-3 w-3" aria-hidden="true" />}</Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.filename}`}>
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <p className="text-muted-foreground">No media files found.</p>
        </div>
      )}

      {/* Toast notification area */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
