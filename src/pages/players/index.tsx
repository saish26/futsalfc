import PageHeader from "@/components/PageHeader";
import PositionBadge from "@/components/PositionBadge";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getPlayers, getTeams } from "@/services/api";
import { SegmentedControl, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

const POSITIONS = [
  { value: "all", label: "All" },
  { value: "goalkeeper", label: "GK" },
  { value: "defender", label: "DEF" },
  { value: "midfielder", label: "MID" },
  { value: "striker", label: "FWD" },
];

export default function PlayersPage() {
  const players = useApi(getPlayers);
  const teams = useApi(getTeams);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");

  const teamName = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t.name])), [teams.data]);

  // /api/players joins team_players, so a player registered in several leagues appears once per team.
  const list = useMemo(() => {
    const merged = new Map<string, { id: string; name: string; position: string; teamIds: string[] }>();
    for (const p of players.data ?? []) {
      const existing = merged.get(p.id);
      if (existing) existing.teamIds.push(p.team_id);
      else merged.set(p.id, { id: p.id, name: p.name, position: p.position, teamIds: [p.team_id] });
    }
    const q = query.trim().toLowerCase();
    return [...merged.values()]
      .filter((p) => position === "all" || p.position?.toLowerCase() === position)
      .filter(
        (p) =>
          !q || p.name.toLowerCase().includes(q) || p.teamIds.some((id) => teamName.get(id)?.toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players.data, query, position, teamName]);

  return (
    <>
      <Head>
        <title>Players · FutsalFC</title>
      </Head>
      <PageHeader eyebrow="Squads" title="Players" subtitle="Everyone registered to a team." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl color="green" size="xs" value={position} onChange={setPosition} data={POSITIONS} />
        <TextInput
          size="sm"
          placeholder="Search player or team"
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-full sm:w-72"
        />
      </div>

      {players.loading ? (
        <LoadingBlock rows={6} height={56} />
      ) : players.error ? (
        <ErrorState message={players.error} onRetry={players.reload} />
      ) : list.length === 0 ? (
        <EmptyState title="No players found" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const primaryTeam = teamName.get(p.teamIds[p.teamIds.length - 1]) ?? "";
            return (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 hover:border-pitch/50 hover:bg-panel-2"
              >
                <TeamCrest name={p.name} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted">
                    {p.teamIds.map((id) => teamName.get(id)).filter(Boolean).join(", ") || primaryTeam || "—"}
                  </div>
                </div>
                <PositionBadge position={p.position} />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
