// frontend/src/components/shared/EmptyState.tsx
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon
}: EmptyStateProps) {
  return (
    <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
      <div className="bg-muted/50 p-4 rounded-full inline-flex border border-border mb-6 shadow-glow-blue text-primary">
        {icon || <PlusCircle className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="bg-brand-gradient hover:opacity-90 text-white border-0">
          {actionText}
        </Button>
      )}
    </div>
  );
}
