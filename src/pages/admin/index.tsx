import AdminLayout from "@/components/admin/AdminLayout";
import MatchCard, { matchToRow } from "@/components/MatchCard";
import PositionBadge from "@/components/PositionBadge";
import Section, { Panel } from "@/components/Section";
import StatTile from "@/components/StatTile";
import { EmptyState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import {
  getAllDues,
  getAllUnavailable,
  getCurrentGameWeek,
  getGameWeekMatches,
  getLeagues,
  getLeagueTeams,
  getPlayers,
  getWallet,
} from "@/services/api";
import { pickActiveLeague } from "@/utils/helpers";
import { Button } from "@mantine/core";
import { IconCash, IconSettings, IconUsers, IconWand } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo } from "react";

export default function AdminOverviewPage() {
  const leagues = useApi(getLeagues);
  const league = useMemo(() => pickActiveLeague(leagues.data ?? []), [leagues.data]);
  const leagueId = league?.id;

  const teams = useApi(() => getLeagueTeams(leagueId!), [leagueId], !!leagueId);
  const players = useApi(getPlayers);
  const dues = useApi(getAllDues);
  const wallet = useApi(getWallet);
  const unavailable = useApi(getAllUnavailable);
  const current = useApi(getCurrentGameWeek);
  const weekId = current.data?.week_id;
  const weekMatches = useApi(() => getGameWeekMatches(weekId!), [weekId], !!weekId);

  const owing = (dues.data ?? []).filter((d) => d.remaining > 0);
  const totalOwed = owing.reduce((s, d) => s + d.remaining, 0);
  const pending = (weekMatches.data ?? []).filter((m) => m.status !== "completed" && m.status !== "cancelled");

  return (
    <AdminLayout
      title="Overview"
      subtitle={league ? `${league.name} · ${league.status}` : "No active league"}
      right={
        <Button component={Link} href="/admin/matches" leftSection={<IconSettings size={16} />}>
          Manage matches
        </Button>
      }
    >
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Teams" value={teams.data?.length ?? "–"} hint={league?.name} />
        <StatTile label="Players" value={new Set((players.data ?? []).map((p) => p.id)).size || "–"} />
        <StatTile label="Outstanding dues" value={`Rs ${totalOwed.toLocaleString()}`} hint={`${owing.length} players`} />
        <StatTile label="Club wallet" value={`Rs ${Number(wallet.data?.amount ?? 0).toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Section
          title={current.data ? `Game week ${current.data.week_number}` : "Current game week"}
          action={weekId ? { href: `/gameweeks/${weekId}`, label: "Public view" } : undefined}
        >
          {current.loading || weekMatches.loading ? (
            <LoadingBlock rows={2} height={84} />
          ) : !current.data ? (
            <EmptyState title="No active game week">
              Generate fixtures from the Leagues tab to create them.
            </EmptyState>
          ) : (weekMatches.data ?? []).length === 0 ? (
            <EmptyState title="No matches this week" />
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">
                {pending.length} of {weekMatches.data!.length} still to play — open one to record goals and the result.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {weekMatches.data!.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <MatchCard match={matchToRow(m)} />
                    <Button
                      component={Link}
                      href={`/admin/matches/${m.id}`}
                      size="xs"
                      variant="light"
                      fullWidth
                      leftSection={<IconSettings size={14} />}
                    >
                      Manage this match
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <div className="space-y-6">
          <Panel className="p-4">
            <h3 className="font-display mb-3 text-lg font-bold uppercase tracking-wide">Quick actions</h3>
            <div className="space-y-2">
              <Button component={Link} href="/admin/leagues" variant="light" fullWidth leftSection={<IconWand size={16} />}>
                Leagues & fixtures
              </Button>
              <Button component={Link} href="/admin/teams" variant="light" fullWidth leftSection={<IconUsers size={16} />}>
                Teams & squads
              </Button>
              <Button component={Link} href="/admin/dues" variant="light" fullWidth leftSection={<IconCash size={16} />}>
                Dues & payments
              </Button>
            </div>
          </Panel>

          <Section title="Unavailable this week">
            {unavailable.loading ? (
              <LoadingBlock rows={3} height={32} />
            ) : (unavailable.data ?? []).length === 0 ? (
              <EmptyState title="Everyone is available" />
            ) : (
              <Panel className="divide-y divide-line">
                {unavailable.data!.map((r) => (
                  <div key={`${r.player_id}-${r.player_name}`} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                    <PositionBadge position={r.position} />
                    <Link href={`/players/${r.player_id}`} className="min-w-0 flex-1 truncate hover:text-pitch">
                      {r.player_name}
                    </Link>
                  </div>
                ))}
              </Panel>
            )}
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}
