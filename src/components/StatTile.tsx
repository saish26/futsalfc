import type { ReactNode } from "react";

export default function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="font-display tabular mt-1 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}
