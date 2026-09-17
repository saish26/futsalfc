import { Button, Skeleton } from "@mantine/core";
import { IconAlertTriangle, IconInbox } from "@tabler/icons-react";
import type { ReactNode } from "react";

export function LoadingBlock({ rows = 3, height = 64 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} radius="md" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-10 text-center">
      <IconAlertTriangle className="text-red-400" size={28} />
      <p className="text-sm text-red-200">{message || "Couldn't load this data."}</p>
      {onRetry && (
        <Button size="xs" variant="light" color="red" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <IconInbox className="text-muted" size={28} />
      <p className="font-medium">{title}</p>
      {children && <p className="text-sm text-muted">{children}</p>}
    </div>
  );
}
