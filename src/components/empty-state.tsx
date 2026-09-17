import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-8">
      {icon}
      <div className="grid gap-1">
        <h2 className="font-heading text-lg">{title}</h2>
        <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
