import PageHeader from "@/components/PageHeader";
import PositionBadge from "@/components/PositionBadge";
import Section from "@/components/Section";
import StatTile from "@/components/StatTile";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getLeagues, getPlayerDetail, getPlayerStats, getTeams } from "@/services/api";
import { Table } from "@mantine/core";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function PlayerDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const detail = useApi(() => getPlayerDetail(id!), [id], ready);
  const stats = useApi(() => getPlayerStats(id!), [id], ready);
  const leagues = useApi(getLeagues);
  const teams = useApi(getTeams);

  const leagueName = useMemo(() => new Map((leagues.data ?? []).map((l) => [l.id, l.name])), [leagues.data]);
  const teamName = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t.name])), [teams.data]);

  if (!ready || detail.loading) return <LoadingBlock rows={3} height={96} />;
  if (detail.error || !detail.data) return <ErrorState message={detail.error ?? "Player not found"} onRetry={detail.reload} />;

  const d = detail.data;
  const p = d.player;
  const isKeeper = p.position?.toLowerCase() === "goalkeeper";
  const isDefensive = isKeeper || p.position?.toLowerCase() === "defender";
  const rows = stats.data ?? [];

  return (
    <>
      <Head>
        <title>{d.name} · FutsalFC</title>
      </Head>
      <PageHeader
        back={{ href: "/players", label: "All players" }}
        eyebrow={
          <span className="flex items-center gap-2">
            <PositionBadge position={p.position} />
            <span className="capitalize">{p.position}</span>
          </span>
        }
        title={d.name}
        subtitle={
          d.team?.name ? (
            <span className="flex items-center gap-2">
              <TeamCrest name={d.team.name} size={20} />
              {d.team.name}
              {d.team.league_name && <span>· {d.team.league_name}</span>}
            </span>
          ) : (
            "Not assigned to a team"
          )
        }
        right={
          <div className="rounded-xl border border-pitch/40 bg-pitch/10 px-5 py-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-pitch">Fantasy points</div>
            <div className="font-display tabular text-4xl font-extrabold">{p.points}</div>
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Goals" value={p.goals} />
        <StatTile label="Assists" value={p.assists} />
        {isDefensive && <StatTile label="Clean sheets" value={p.cleanSheets} />}
        {isKeeper && <StatTile label="Penalty saves" value={p.penaltySaved} />}
        {isDefensive && <StatTile label="Conceded" value={p.goalsConceded} />}
        <StatTile label="Yellow cards" value={p.yellowCards} />
        <StatTile label="Red cards" value={p.redCards} />
        <StatTile label="Pens missed" value={p.penaltyMissed} />
      </div>

      <Section title="By league">
        {stats.loading ? (
          <LoadingBlock rows={2} height={40} />
        ) : stats.error ? (
          <ErrorState message={stats.error} onRetry={stats.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No league stats yet" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <Table
              className="tabular"
              miw={640}
              verticalSpacing="sm"
              styles={{ th: { color: "var(--color-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" } }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>League</Table.Th>
                  <Table.Th>Team</Table.Th>
                  <Table.Th ta="center">G</Table.Th>
                  <Table.Th ta="center">A</Table.Th>
                  <Table.Th ta="center">CS</Table.Th>
                  <Table.Th ta="center">PS</Table.Th>
                  <Table.Th ta="center">GC</Table.Th>
                  <Table.Th ta="center">YC</Table.Th>
                  <Table.Th ta="center">RC</Table.Th>
                  <Table.Th ta="center">Pts</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      {s.league_id ? (
                        <Link href={`/leagues/${s.league_id}?tab=stats`} className="hover:text-pitch">
                          {leagueName.get(s.league_id) ?? "League"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                    <Table.Td className="text-muted">
                      {s.team_id ? (
                        <Link href={`/teams/${s.team_id}`} className="hover:text-white">
                          {teamName.get(s.team_id) ?? "Team"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                    <Table.Td ta="center">{s.goals}</Table.Td>
                    <Table.Td ta="center">{s.assists}</Table.Td>
                    <Table.Td ta="center">{s.clean_sheets}</Table.Td>
                    <Table.Td ta="center">{s.penalty_saves}</Table.Td>
                    <Table.Td ta="center">{s.goals_conceded}</Table.Td>
                    <Table.Td ta="center">{s.yellow_cards}</Table.Td>
                    <Table.Td ta="center">{s.red_cards}</Table.Td>
                    <Table.Td ta="center">
                      <span className="font-display text-base font-bold text-pitch">{s.points}</span>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Section>
    </>
  );
}
