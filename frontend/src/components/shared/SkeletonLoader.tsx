// frontend/src/components/shared/SkeletonLoader.tsx

const shimmerClass = "relative overflow-hidden bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl ${shimmerClass} ${className}`} />;
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return <div className={`h-16 rounded-lg ${shimmerClass} ${className}`} />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full">
      <div className={`h-10 rounded-lg ${shimmerClass} w-full`} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonKPI({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-border rounded-xl p-6 ${shimmerClass} ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
        </div>
        <div className="h-10 w-10 bg-muted rounded-lg" />
      </div>
      <div className="h-4 w-16 bg-muted rounded mt-4" />
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-border rounded-xl p-6 flex flex-col ${shimmerClass} ${className}`}>
      <div className="flex justify-between mb-6">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-6 w-24 bg-muted rounded" />
      </div>
      <div className="flex-1 min-h-[200px] bg-muted rounded" />
    </div>
  );
}
