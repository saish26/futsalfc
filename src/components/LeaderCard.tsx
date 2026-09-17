import type { ReactNode } from "react";

interface Props {
  label: string;
  icon: ReactNode;
  value?: number | null;
  playerName?: string | null;
  teamName?: string | null;
  href?: string;
}

export default function LeaderCard({ label, icon, value, playerName, teamName }: Props) {
  const empty = !playerName || !value;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
        <div className="truncate font-semibold">{empty ? "—" : playerName}</div>
        {!empty && teamName && <div className="truncate text-xs text-muted">{teamName}</div>}
      </div>
      <div className="font-display tabular text-3xl font-bold text-pitch">{empty ? 0 : value}</div>
    </div>
  );
}
