// frontend/src/components/ui/bulk-actions.tsx
"use client"

import { useState, useCallback } from "react"
import toast from "react-hot-toast"
import { Trash2, Power, PowerOff, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Bulk actions hook for managing selection state and performing batch operations.
 *
 * @template T - Item type extending `{ id: string }`
 * @returns Object with selection state and action handlers
 */
export function useBulkActions<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  /**
   * Toggle selection of a single item.
   *
   * @param id - The item ID to toggle
   */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  /**
   * Select or deselect all items.
   *
   * @param ids - Array of all available item IDs
   */
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) =>
      prev.length === ids.length ? [] : [...ids]
    )
  }, [])

  /**
   * Clear all selections.
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  /**
   * Enable selected items via the provided API call.
   *
   * @param apiCall - Async function that receives the selected IDs
   */
  const enableSelected = useCallback(async (apiCall: (ids: string[]) => Promise<void>) => {
    try {
      await apiCall(selectedIds)
      toast.success(`${selectedIds.length} item(s) enabled`)
      clearSelection()
    } catch (error: any) {
      toast.error(error.message || "Failed to enable items")
    }
  }, [selectedIds, clearSelection])

  /**
   * Disable selected items via the provided API call.
   *
   * @param apiCall - Async function that receives the selected IDs
   */
  const disableSelected = useCallback(async (apiCall: (ids: string[]) => Promise<void>) => {
    try {
      await apiCall(selectedIds)
      toast.success(`${selectedIds.length} item(s) disabled`)
      clearSelection()
    } catch (error: any) {
      toast.error(error.message || "Failed to disable items")
    }
  }, [selectedIds, clearSelection])

  /**
   * Delete selected items via the provided API call.
   *
   * @param apiCall - Async function that receives the selected IDs
   */
  const deleteSelected = useCallback(async (apiCall: (ids: string[]) => Promise<void>) => {
    try {
      await apiCall(selectedIds)
      toast.success(`${selectedIds.length} item(s) deleted`)
      clearSelection()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete items")
    }
  }, [selectedIds, clearSelection])

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    enableSelected,
    disableSelected,
    deleteSelected,
  }
}

type ConfirmAction = "enable" | "disable" | "delete" | null

interface BulkActionsBarProps {
  /** Number of selected items */
  count: number
  /** Callback to enable selected items */
  onEnable: () => void
  /** Callback to disable selected items */
  onDisable: () => void
  /** Callback to delete selected items */
  onDelete: () => void
  /** Callback to clear selection */
  onClear: () => void
}

/**
 * Bulk actions toolbar displayed when items are selected.
 *
 * Provides buttons for enabling, disabling, and deleting selected items
 * with a confirmation dialog for destructive actions.
 */
export function BulkActionsBar({
  count,
  onEnable,
  onDisable,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  if (count === 0) return null

  const actionLabels: Record<Exclude<ConfirmAction, null>, { title: string; description: string }> = {
    enable: {
      title: "Enable Items",
      description: `Are you sure you want to enable ${count} item(s)?`,
    },
    disable: {
      title: "Disable Items",
      description: `Are you sure you want to disable ${count} item(s)?`,
    },
    delete: {
      title: "Delete Items",
      description: `Are you sure you want to delete ${count} item(s)? This action cannot be undone.`,
    },
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction === "enable") onEnable()
    if (confirmAction === "disable") onDisable()
    if (confirmAction === "delete") onDelete()
    setConfirmAction(null)
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-lg">
          <Badge variant="default" className="text-sm">
            {count} selected
          </Badge>

          <div className="h-4 w-px bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("enable")}
            className="gap-1.5"
          >
            <Power className="h-4 w-4" />
            Enable
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("disable")}
            className="gap-1.5"
          >
            <PowerOff className="h-4 w-4" />
            Disable
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmAction("delete")}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <div className="h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction ? actionLabels[confirmAction].title : ""}
            </DialogTitle>
            <DialogDescription>
              {confirmAction ? actionLabels[confirmAction].description : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "delete" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
