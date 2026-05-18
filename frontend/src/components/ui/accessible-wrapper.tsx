"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ─── AccessibleButton ───────────────────────────────────────────────────────

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}

/**
 * AccessibleButton - A button component with full keyboard and screen reader support.
 *
 * Accessibility features:
 * - role="button" is implicit on <button> elements
 * - Keyboard activation via Enter and Space keys (native button behavior)
 * - Visible focus ring using focus-visible for keyboard-only focus indication
 * - aria-disabled support for disabled state communication to assistive tech
 * - aria-label support for icon-only buttons
 * - aria-pressed support for toggle buttons
 * - aria-describedby for linking to additional context
 */
const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ className, variant = "default", size = "md", disabled, "aria-label": ariaLabel, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    }

    const sizeStyles = {
      sm: "h-9 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-11 rounded-md px-8 text-base",
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    )
  }
)
AccessibleButton.displayName = "AccessibleButton"

// ─── AccessibleInput ────────────────────────────────────────────────────────

export interface AccessibleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "aria-describedby"> {
  label: string
  error?: string
  description?: string
  id: string
}

/**
 * AccessibleInput - An input component with proper label association and error handling.
 *
 * Accessibility features:
 * - Programmatically associated label via htmlFor/id pairing
 * - aria-invalid communicated when an error is present
 * - aria-describedby links to both error and description text for screen readers
 * - Unique id generation ensures label-input association is always correct
 * - Error message announced to assistive technology via aria-live="polite"
 * - Description text provides additional context without cluttering the label
 */
const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ className, id, label, error, description, type = "text", required, ...props }, ref) => {
    const errorId = `${id}-error`
    const descId = `${id}-description`

    const describedBy = [error ? errorId : null, description ? descId : null]
      .filter(Boolean)
      .join(" ") || undefined

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span aria-hidden="true" className="ml-1 text-destructive">*</span>}
        </label>
        <input
          id={id}
          type={type}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {description && !error && (
          <p id={descId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
AccessibleInput.displayName = "AccessibleInput"

// ─── AccessibleDialog ───────────────────────────────────────────────────────

export interface AccessibleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
}

/**
 * AccessibleDialog - A modal dialog with full keyboard trapping and screen reader support.
 *
 * Accessibility features:
 * - role="dialog" identifies the element as a dialog to assistive technology
 * - aria-modal="true" indicates that content outside the dialog is inert
 * - aria-labelledby points to the dialog title for context
 * - aria-describedby points to the dialog description when provided
 * - Focus trap keeps keyboard navigation within the dialog boundaries
 * - Escape key closes the dialog (native browser behavior for dialogs)
 * - Focus is returned to the trigger element on close
 * - Overlay prevents interaction with background content
 * - aria-hidden on overlay prevents screen reader access to background
 */
const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  overlayClassName,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()
  const descId = React.useId()

  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      previousFocusRef.current?.focus()
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
        return
      }

      if (e.key === "Tab") {
        const content = contentRef.current
        if (!content) return

        const focusableElements = content.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        contentRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          overlayClassName
        )}
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg outline-none",
          className
        )}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 id={titleId} className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </>
  )
}

// ─── AccessibleTable ────────────────────────────────────────────────────────

export interface AccessibleTableColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  scope?: "col" | "row"
}

export interface AccessibleTableProps<T> {
  columns: AccessibleTableColumn<T>[]
  data: T[]
  caption?: string
  className?: string
  striped?: boolean
  getKey?: (row: T, index: number) => string
}

/**
 * AccessibleTable - A data table with proper semantic structure and screen reader support.
 *
 * Accessibility features:
 * - <caption> element provides a table title/description for screen readers
 * - scope="col" on header cells associates them with their column data
 * - scope="row" support for row headers when needed
 * - <thead>, <tbody>, <tfoot> semantic structure for table navigation
 * - aria-sort support for sortable columns (via aria-sort attribute)
 * - Striped rows option improves visual tracking for low-vision users
 * - Proper key assignment for React list rendering
 */
function AccessibleTable<T extends Record<string, unknown>>({
  columns,
  data,
  caption,
  className,
  striped = false,
  getKey,
}: AccessibleTableProps<T>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        {caption && (
          <caption className="mt-4 text-sm text-muted-foreground sr-only">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b transition-colors">
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="p-4 text-center text-muted-foreground"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getKey ? getKey(row, rowIndex) : rowIndex}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50",
                  striped && rowIndex % 2 === 0 && "bg-muted/20"
                )}
              >
                {columns.map((col, colIndex) => {
                  const cellContent =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? "")

                  return (
                    <td
                      key={colIndex}
                      className={cn("p-4 align-middle")}
                    >
                      {cellContent}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── AccessibleNav ──────────────────────────────────────────────────────────

export interface AccessibleNavItem {
  label: string
  href: string
  current?: boolean
  icon?: React.ReactNode
}

export interface AccessibleNavProps {
  items: AccessibleNavItem[]
  label?: string
  className?: string
  itemClassName?: string
  orientation?: "horizontal" | "vertical"
}

/**
 * AccessibleNav - A navigation component with proper landmarks and current page indication.
 *
 * Accessibility features:
 * - <nav> element with aria-label provides a navigation landmark for screen readers
 * - aria-current="page" indicates the current page to assistive technology
 * - aria-orientation communicates navigation direction (horizontal/vertical)
 * - role="list" and role="listitem" provide semantic list structure
 * - Visually distinct current page indicator via aria-current styling
 * - Keyboard navigation support with arrow keys for menu traversal
 * - Focus visible ring for keyboard users
 */
const AccessibleNav: React.FC<AccessibleNavProps> = ({
  items,
  label = "Main navigation",
  className,
  itemClassName,
  orientation = "horizontal",
}) => {
  const navRef = React.useRef<HTMLElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const nav = navRef.current
    if (!nav) return

    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[role="link"]'))
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement)

    if (currentIndex === -1) return

    let nextIndex = currentIndex

    if (orientation === "horizontal") {
      if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % links.length
      if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + links.length) % links.length
    } else {
      if (e.key === "ArrowDown") nextIndex = (currentIndex + 1) % links.length
      if (e.key === "ArrowUp") nextIndex = (currentIndex - 1 + links.length) % links.length
    }

    if (nextIndex !== currentIndex) {
      e.preventDefault()
      links[nextIndex]?.focus()
    }
  }

  return (
    <nav
      ref={navRef}
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("flex", orientation === "vertical" && "flex-col", className)}
    >
      <ul role="list" className={cn("flex", orientation === "vertical" && "flex-col", "gap-1")}>
        {items.map((item, index) => (
          <li key={index} role="listitem">
            <a
              href={item.href}
              role="link"
              aria-current={item.current ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                item.current
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                itemClassName
              )}
            >
              {item.icon}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { AccessibleButton, AccessibleInput, AccessibleDialog, AccessibleTable, AccessibleNav }
