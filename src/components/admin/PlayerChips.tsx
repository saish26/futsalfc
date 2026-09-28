import PositionBadge from "@/components/PositionBadge";
import type { TeamPlayer } from "@/types";
import { Chip, ChipGroup, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

/**
 * A tap-to-select grid of players, used in place of a dropdown so picking a scorer,
 * assist or card recipient is one click instead of open-menu-then-click.
 */
export default function PlayerChips({
  players,
  value,
  onChange,
  emptyMessage = "No players available",
  color,
}: {
  players: TeamPlayer[];
  value: string | null;
  onChange: (playerId: string | null) => void;
  emptyMessage?: string;
  color?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players;
  }, [players, query]);

  if (players.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div>
      {players.length > 8 && (
        <TextInput
          size="xs"
          className="mb-2"
          placeholder="Search player"
          leftSection={<IconSearch size={13} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      )}
      <ChipGroup value={value} onChange={(v) => onChange(v ? String(v) : null)}>
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((p) => (
            <Chip key={p.id} value={p.id} size="xs" color={color} variant="filled">
              <span className="flex items-center gap-1">
                <PositionBadge position={p.position} />
                {p.name}
              </span>
            </Chip>
          ))}
        </div>
      </ChipGroup>
      {filtered.length === 0 && <p className="text-sm text-muted">No players match &quot;{query}&quot;</p>}
    </div>
  );
}
