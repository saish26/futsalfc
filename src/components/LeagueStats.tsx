import { useApi } from "@/hooks/useApi";
import { getAllPlayerStats, getTopAssists, getTopScorer, getTopYellowCards } from "@/services/api";
import type { PlayerStatsWithNames } from "@/types";
import { SegmentedControl, Table, TextInput } from "@mantine/core";
import { IconBallFootball, IconSearch, IconShoe, IconSquareFilled } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import LeaderCard from "./LeaderCard";
import PointsExplainer from "./PointsExplainer";
import PositionBadge from "./PositionBadge";
import { EmptyState, ErrorState, LoadingBlock } from "./States";

type SortKey = "points" | "goals" | "assists" | "clean_sheets" | "yellow_cards";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "goals", label: "Goals" },
  { value: "assists", label: "Assists" },
  { value: "clean_sheets", label: "Clean sheets" },
  { value: "yellow_cards", label: "Cards" },
];

export default function LeagueStats({ leagueId }: { leagueId: string }) {
  const scorer = useApi(() => getTopScorer(leagueId), [leagueId]);
  const assists = useApi(() => getTopAssists(leagueId), [leagueId]);
  const yellows = useApi(() => getTopYellowCards(leagueId), [leagueId]);
  const stats = useApi(getAllPlayerStats, []);

  const [sort, setSort] = useState<SortKey>("points");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (stats.data ?? [])
      .filter((s) => s.league_id === leagueId)
      .filter((s) => !q || s.player_name?.toLowerCase().includes(q) || s.team_name?.toLowerCase().includes(q))
      .sort((a, b) => (b[sort] as number) - (a[sort] as number) || b.points - a.points);
  }, [stats.data, leagueId, sort, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <LeaderCard
          label="Top scorer"
          icon={<IconBallFootball className="text-pitch" size={22} />}
          value={scorer.data?.goals}
          playerName={scorer.data?.name}
          teamName={scorer.data?.team_name}
        />
        <LeaderCard
          label="Most assists"
          icon={<IconShoe className="text-sky-400" size={22} />}
          value={assists.data?.assists}
          playerName={assists.data?.name}
          teamName={assists.data?.team_name}
        />
        <LeaderCard
          label="Most yellow cards"
          icon={<IconSquareFilled className="text-yellow-400" size={18} />}
          value={yellows.data?.yellow_cards}
          playerName={yellows.data?.name}
          teamName={yellows.data?.team_name}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="overflow-x-auto">
          <SegmentedControl color="green" size="xs" value={sort} onChange={(v) => setSort(v as SortKey)} data={SORTS} />
        </div>
        <TextInput
          size="xs"
          placeholder="Search player or team"
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-full sm:w-60"
        />
      </div>

      {stats.loading ? (
        <LoadingBlock rows={6} height={40} />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No player stats yet">Stats appear once matches are played.</EmptyState>
      ) : (
        <StatsTable rows={rows} sort={sort} />
      )}

      <PointsExplainer />
    </div>
  );
}

function StatsTable({ rows, sort }: { rows: PlayerStatsWithNames[]; sort: SortKey }) {
  const cell = (key: SortKey, v: number) => (
    <Table.Td ta="center" className={sort === key ? "font-semibold text-pitch" : ""}>
      {v}
    </Table.Td>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <Table
        verticalSpacing="xs"
        className="tabular"
        miw={720}
        styles={{ th: { color: "var(--color-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" } }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={36}>#</Table.Th>
            <Table.Th>Player</Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th ta="center">G</Table.Th>
            <Table.Th ta="center">A</Table.Th>
            <Table.Th ta="center">CS</Table.Th>
            <Table.Th ta="center">PS</Table.Th>
            <Table.Th ta="center">YC</Table.Th>
            <Table.Th ta="center">RC</Table.Th>
            <Table.Th ta="center">Pts</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((s, i) => (
            <Table.Tr key={s.id}>
              <Table.Td className="text-muted">{i + 1}</Table.Td>
              <Table.Td>
                <Link href={`/players/${s.player_id}`} className="flex items-center gap-2 hover:text-pitch">
                  <span className="font-medium">{s.player_name}</span>
                  <PositionBadge position={s.position} />
                </Link>
              </Table.Td>
              <Table.Td className="text-muted">
                {s.team_id ? (
                  <Link href={`/teams/${s.team_id}`} className="hover:text-white">
                    {s.team_name}
                  </Link>
                ) : (
                  s.team_name || "—"
                )}
              </Table.Td>
              {cell("goals", s.goals)}
              {cell("assists", s.assists)}
              {cell("clean_sheets", s.clean_sheets)}
              <Table.Td ta="center">{s.penalty_saves}</Table.Td>
              {cell("yellow_cards", s.yellow_cards)}
              <Table.Td ta="center">{s.red_cards}</Table.Td>
              <Table.Td ta="center">
                <span className={`font-display text-base font-bold ${sort === "points" ? "text-pitch" : ""}`}>
                  {s.points}
                </span>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <div className="border-t border-line px-3 py-2 text-xs text-muted">
        G goals · A assists · CS clean sheets · PS penalty saves · YC/RC yellow/red cards
      </div>
    </div>
  );
}
