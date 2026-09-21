import AvailabilityCard from "@/components/AvailabilityCard";
import MatchCard, { matchToRow } from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import PositionBadge from "@/components/PositionBadge";
import RequireAuth from "@/components/RequireAuth";
import Section, { Panel } from "@/components/Section";
import StandingsTable from "@/components/StandingsTable";
import StatTile from "@/components/StatTile";
import { EmptyState, LoadingBlock } from "@/components/States";
import TeamCrest from "@/components/TeamCrest";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import {
  getAllDues,
  getAllUnavailable,
  getCurrentGameWeek,
  getLeagueMatches,
  getLeagueTeams,
  getMyDues,
  getPlayers,
  getPlayerStats,
  getTeam,
  getTeamAttendance,
} from "@/services/api";
import type { Match } from "@/types";
import { Alert, Badge, Table } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";

export default function MyProfilePage() {
  return (
    <RequireAuth>
      <MyProfile />
    </RequireAuth>
  );
}

function MyProfile() {
  const { user, profile, needsOnboarding, isAdmin } = useAuth();

  if (isAdmin) return <AdminHome name={user?.name} />;
  if (needsOnboarding || !profile?.playerId) return <NeedsOnboarding />;

  return <PlayerHome playerId={profile.playerId} />;
}

function NeedsOnboarding() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">One more step</h1>
      <p className="mt-2 text-sm text-muted">Pick your position so we can track your stats and points.</p>
      <Link
        href="/onboarding"
        className="mt-5 inline-block rounded-md bg-pitch px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-400"
      >
        Set up my profile
      </Link>
    </div>
  );
}

function PlayerHome({ playerId }: { playerId: string }) {
  const { profile } = useAuth();

  // The profile carries team *names* only, so resolve the team id from the players list.
  const players = useApi(getPlayers);
  const teamIds = useMemo(
    () => (players.data ?? []).filter((p) => p.id === playerId).map((p) => p.team_id),
    [players.data, playerId]
  );
  const teamId = teamIds[teamIds.length - 1];

  const team = useApi(() => getTeam(teamId!), [teamId], !!teamId);
  const leagueId = team.data?.league_id;
  const matches = useApi(() => getLeagueMatches(leagueId!), [leagueId], !!leagueId);
  const leagueTeams = useApi(() => getLeagueTeams(leagueId!), [leagueId], !!leagueId);
  const stats = useApi(() => getPlayerStats(playerId), [playerId]);
  const dues = useApi(() => getMyDues(playerId), [playerId]);
  const current = useApi(getCurrentGameWeek);
  const weekId = current.data?.week_id;
  const roster = useApi(() => getTeamAttendance(teamId!, weekId!), [teamId, weekId], !!teamId && !!weekId);

  const p = profile?.player;
  const time = (m: Match) => dayjs(m.match_date ?? m.updated_at).valueOf();
  const mine = (matches.data ?? []).filter((m) => m.team1_id === teamId || m.team2_id === teamId);
  const next = mine.filter((m) => m.status === "scheduled" || m.status === "live").sort((a, b) => time(a) - time(b));
  const recent = mine.filter((m) => m.status === "completed").sort((a, b) => time(b) - time(a)).slice(0, 3);
  const totals = (stats.data ?? []).reduce(
    (acc, s) => ({
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      points: acc.points + s.points,
    }),
    { goals: 0, assists: 0, points: 0 }
  );

  return (
    <>
      <Head>
        <title>My profile · FutsalFC</title>
      </Head>

      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <PositionBadge position={p?.position} />
            <span className="capitalize">{p?.position || "Player"}</span>
          </span>
        }
        title={profile?.name || "My profile"}
        subtitle={<TeamLine teamId={team.data?.id} teamName={team.data?.name ?? profile?.team?.name} leagueName={profile?.team?.league_name} loading={players.loading || team.loading} />}
        right={
          <div className="rounded-xl border border-pitch/40 bg-pitch/10 px-5 py-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-pitch">Fantasy points</div>
            <div className="font-display tabular text-4xl font-extrabold">{p?.points ?? totals.points}</div>
          </div>
        }
      />

      {!teamId && !players.loading && !profile?.team?.name && (
        <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />} className="mb-6">
          You&apos;re not on a team yet. An admin needs to add you before fixtures and availability show up here.
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Goals" value={p?.goals ?? totals.goals} />
        <StatTile label="Assists" value={p?.assists ?? totals.assists} />
        <StatTile label="Clean sheets" value={p?.cleanSheets ?? 0} />
        <StatTile label="Penalty saves" value={p?.penaltySaved ?? 0} />
        <StatTile label="Yellow cards" value={p?.yellowCards ?? 0} />
        <StatTile label="Red cards" value={p?.redCards ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <Section title="My next matches">
            {matches.loading || players.loading ? (
              <LoadingBlock rows={2} height={84} />
            ) : next.length === 0 ? (
              <EmptyState title="No upcoming matches">
                {teamId ? "Nothing scheduled for your team yet." : "Join a team to see your fixtures."}
              </EmptyState>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {next.slice(0, 4).map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            )}
          </Section>

          {recent.length > 0 && (
            <Section title="Recent results" action={teamId ? { href: `/teams/${teamId}`, label: "My team" } : undefined}>
              <div className="grid gap-3 md:grid-cols-2">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            </Section>
          )}

          {(roster.data ?? []).length > 0 && (
            <Section title={`Squad availability · game week ${current.data?.week_number ?? ""}`}>
              <Panel className="divide-y divide-line">
                {roster.data!.map((r) => (
                  <div key={r.player_id} className="flex items-center gap-3 px-4 py-2.5">
                    <Link href={`/players/${r.player_id}`} className="min-w-0 flex-1 truncate hover:text-pitch">
                      {r.player_name}
                      {r.player_id === playerId && <span className="ml-2 text-xs text-muted">(you)</span>}
                    </Link>
                    <Badge
                      size="sm"
                      variant="light"
                      color={r.status === "unavailable" ? "yellow" : "green"}
                      leftSection={r.status === "unavailable" ? <IconX size={12} /> : <IconCheck size={12} />}
                    >
                      {r.status === "unavailable" ? "Out" : "Available"}
                    </Badge>
                  </div>
                ))}
              </Panel>
            </Section>
          )}

          {(stats.data ?? []).length > 0 && (
            <Section title="My stats by league">
              <div className="overflow-x-auto rounded-xl border border-line bg-panel">
                <Table className="tabular" miw={520} verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Season</Table.Th>
                      <Table.Th ta="center">G</Table.Th>
                      <Table.Th ta="center">A</Table.Th>
                      <Table.Th ta="center">CS</Table.Th>
                      <Table.Th ta="center">YC</Table.Th>
                      <Table.Th ta="center">Pts</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats.data!.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>
                          {s.league_id ? (
                            <Link href={`/leagues/${s.league_id}?tab=stats`} className="hover:text-pitch">
                              {profile?.team?.league_name || "League"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </Table.Td>
                        <Table.Td ta="center">{s.goals}</Table.Td>
                        <Table.Td ta="center">{s.assists}</Table.Td>
                        <Table.Td ta="center">{s.clean_sheets}</Table.Td>
                        <Table.Td ta="center">{s.yellow_cards}</Table.Td>
                        <Table.Td ta="center">
                          <span className="font-display text-base font-bold text-pitch">{s.points}</span>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <AvailabilityCard
            playerId={playerId}
            teamId={teamId}
            gameWeekId={weekId}
            weekNumber={current.data?.week_number}
            onChanged={roster.reload}
          />

          <Panel className="p-4">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide">My dues</h3>
            {dues.loading ? (
              <LoadingBlock rows={1} height={28} />
            ) : dues.error ? (
              <p className="mt-1 text-sm text-muted">No dues recorded for you.</p>
            ) : (
              <>
                <div className="font-display tabular mt-1 text-3xl font-bold">
                  Rs {Number(dues.data?.remaining ?? 0).toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {Number(dues.data?.remaining ?? 0) > 0 ? "Outstanding balance" : "All settled — nice one"}
                </p>
              </>
            )}
          </Panel>

          {leagueTeams.data && leagueTeams.data.length > 0 && (
            <Section title="My league">
              <StandingsTable teams={leagueTeams.data} compact highlightId={teamId} />
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function TeamLine({
  teamId,
  teamName,
  leagueName,
  loading,
}: {
  teamId?: string;
  teamName?: string;
  leagueName?: string;
  loading: boolean;
}) {
  if (!teamName) return <span>{loading ? "Loading your team…" : "Not assigned to a team yet"}</span>;

  const body = (
    <>
      <TeamCrest name={teamName} size={20} />
      {teamName}
      {leagueName && <span>· {leagueName}</span>}
    </>
  );

  return teamId ? (
    <Link href={`/teams/${teamId}`} className="flex items-center gap-2 hover:text-white">
      {body}
    </Link>
  ) : (
    <span className="flex items-center gap-2">{body}</span>
  );
}

function AdminHome({ name }: { name?: string }) {
  const dues = useApi(getAllDues);
  const unavailable = useApi(getAllUnavailable);
  const current = useApi(getCurrentGameWeek);

  const owing = (dues.data ?? []).filter((d) => d.remaining > 0);
  const totalOwed = owing.reduce((s, d) => s + d.remaining, 0);

  return (
    <>
      <Head>
        <title>Admin · FutsalFC</title>
      </Head>
      <PageHeader eyebrow="Admin" title={name || "Admin"} subtitle="Signed in as an administrator." />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Players owing dues" value={owing.length} />
        <StatTile label="Total outstanding" value={`Rs ${totalOwed.toLocaleString()}`} />
        <StatTile label="Unavailable players" value={(unavailable.data ?? []).length} />
        <StatTile label="Current game week" value={current.data?.week_number ?? "–"} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Section title="Dues">
          {dues.loading ? (
            <LoadingBlock rows={4} height={36} />
          ) : (dues.data ?? []).length === 0 ? (
            <EmptyState title="No dues recorded" />
          ) : (
            <Panel className="divide-y divide-line">
              {dues.data!.map((d) => (
                <div key={d.player_id} className="flex items-center gap-3 px-4 py-2.5">
                  <Link href={`/players/${d.player_id}`} className="min-w-0 flex-1 truncate hover:text-pitch">
                    {d.player_name}
                  </Link>
                  <span className={`tabular font-semibold ${d.remaining > 0 ? "text-yellow-400" : "text-muted"}`}>
                    Rs {d.remaining.toLocaleString()}
                  </span>
                </div>
              ))}
            </Panel>
          )}
        </Section>

        <Section title="Marked unavailable">
          {unavailable.loading ? (
            <LoadingBlock rows={4} height={36} />
          ) : (unavailable.data ?? []).length === 0 ? (
            <EmptyState title="Everyone is available" />
          ) : (
            <Panel className="divide-y divide-line">
              {unavailable.data!.map((r) => (
                <div key={`${r.player_id}-${r.status}`} className="flex items-center gap-3 px-4 py-2.5">
                  <Link href={`/players/${r.player_id}`} className="min-w-0 flex-1 truncate hover:text-pitch">
                    {r.player_name}
                  </Link>
                  <PositionBadge position={r.position} />
                </div>
              ))}
            </Panel>
          )}
        </Section>
      </div>

      <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />} className="mt-8">
        This UI is read-only. Creating leagues, fixtures, results and dues still happens through the API.
      </Alert>
    </>
  );
}
