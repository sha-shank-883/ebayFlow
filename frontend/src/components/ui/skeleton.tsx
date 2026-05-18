// frontend/src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface CardSkeletonProps {
  className?: string
  image?: boolean
  footer?: boolean
}

function CardSkeleton({ className, image = true, footer = true }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 space-y-4", className)}>
      {image && <Skeleton className="h-48 w-full rounded-md" />}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {footer && (
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  )
}

interface ListSkeletonProps {
  className?: string
  count?: number
  avatar?: boolean
}

function ListSkeleton({ className, count = 5, avatar = true }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          {avatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

interface PageSkeletonProps {
  className?: string
  header?: boolean
  stats?: boolean
  content?: "cards" | "list" | "table"
}

function PageSkeleton({ className, header = true, stats = true, content = "cards" }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {header && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {content === "cards" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {content === "list" && <ListSkeleton count={8} />}

      {content === "table" && <TableSkeleton rows={8} />}
    </div>
  )
}

interface TableSkeletonProps {
  className?: string
  rows?: number
  columns?: number
}

function TableSkeleton({ className, rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
      </div>
      <div className="divide-y divide-border">
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4",
                  colIndex === 0 && "w-3/4",
                  colIndex === columns - 1 && "w-16 ml-auto"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, CardSkeleton, ListSkeleton, PageSkeleton, TableSkeleton }
