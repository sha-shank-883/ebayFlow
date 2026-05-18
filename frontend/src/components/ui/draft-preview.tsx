"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Content type for the draft preview modal.
 */
export interface DraftPreviewContent {
  title: string
  html: string
  type: "blog" | "page" | "section"
}

/**
 * Shape of the draft preview context value.
 */
interface DraftPreviewContextValue {
  isOpen: boolean
  content: DraftPreviewContent | null
  openPreview: (content: DraftPreviewContent) => void
  closePreview: () => void
}

const DraftPreviewContext = React.createContext<DraftPreviewContextValue | undefined>(undefined)

/**
 * Provider component that wraps the app and manages draft preview state.
 */
function DraftPreviewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [content, setContent] = React.useState<DraftPreviewContent | null>(null)

  const openPreview = React.useCallback((newContent: DraftPreviewContent) => {
    setContent(newContent)
    setIsOpen(true)
  }, [])

  const closePreview = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <DraftPreviewContext.Provider value={{ isOpen, content, openPreview, closePreview }}>
      {children}
    </DraftPreviewContext.Provider>
  )
}

/**
 * Hook to access draft preview state and actions.
 *
 * @example
 * ```tsx
 * const { openPreview, closePreview, isOpen, content } = useDraftPreview()
 *
 * openPreview({ title: "My Post", html: "<p>Hello</p>", type: "blog" })
 * ```
 */
export function useDraftPreview(): DraftPreviewContextValue {
  const context = React.useContext(DraftPreviewContext)
  if (!context) {
    throw new Error("useDraftPreview must be used within a DraftPreviewProvider")
  }
  return context
}

/**
 * Sanitizes HTML content by removing script tags and event handlers.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*\S+/gi, "")
    .replace(/javascript\s*:/gi, "")
}

/**
 * Props for the DraftPreviewModal component.
 */
export interface DraftPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  content: DraftPreviewContent
}

/**
 * A responsive modal that previews draft content in a sandboxed iframe-like environment.
 *
 * Displays a "DRAFT PREVIEW" banner, sanitizes HTML before rendering, and
 * provides a close button. Uses Tailwind CSS and matches the existing dark theme.
 *
 * @example
 * ```tsx
 * <DraftPreviewModal
 *   isOpen={showPreview}
 *   onClose={() => setShowPreview(false)}
 *   content={{ title: "My Blog Post", html: "<p>Content</p>", type: "blog" }}
 * />
 * ```
 */
export function DraftPreviewModal({ isOpen, onClose, content }: DraftPreviewModalProps) {
  const sanitizedHtml = React.useMemo(() => sanitizeHtml(content.html), [content.html])

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const typeLabel = content.type === "blog" ? "Blog Post" : content.type === "page" ? "Page" : "Section"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Draft preview: ${content.title}`}
        className={cn(
          "relative z-50 flex flex-col w-[95vw] max-w-5xl h-[90vh] bg-background border border-border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              DRAFT PREVIEW
            </span>
            <span className="text-xs text-muted-foreground">{typeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground truncate max-w-xs">{content.title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
          <div className="max-w-4xl mx-auto p-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <span>HTML content is sandboxed &middot; scripts removed</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}

export { DraftPreviewProvider }
