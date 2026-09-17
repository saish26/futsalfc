import MatchCard, { matchToRow } from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import PositionBadge from "@/components/PositionBadge";
import Section from "@/components/Section";
import StandingsTable from "@/components/StandingsTable";
import StatTile from "@/components/StatTile";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getLeague, getLeagueMatches, getLeagueTeams, getTeam, getTeamPlayers } from "@/services/api";
import type { Match } from "@/types";
import { sortStandings } from "@/utils/helpers";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const POSITION_ORDER = ["goalkeeper", "defender", "midfielder", "striker"];

type Outcome = "W" | "D" | "L";
const outcomeFor = (m: Match, teamId: string): Outcome => {
  const mine = m.team1_id === teamId ? m.team1_score : m.team2_score;
  const theirs = m.team1_id === teamId ? m.team2_score : m.team1_score;
  return mine > theirs ? "W" : mine < theirs ? "L" : "D";
};
const OUTCOME_CLS: Record<Outcome, string> = {
  W: "bg-pitch text-ink",
  D: "bg-zinc-500 text-white",
  L: "bg-red-600 text-white",
};

export default function TeamDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const team = useApi(() => getTeam(id!), [id], ready);
  const players = useApi(() => getTeamPlayers(id!), [id], ready);
  const leagueId = team.data?.league_id;
  const league = useApi(() => getLeague(leagueId!), [leagueId], !!leagueId);
  const leagueTeams = useApi(() => getLeagueTeams(leagueId!), [leagueId], !!leagueId);
  const matches = useApi(() => getLeagueMatches(leagueId!), [leagueId], !!leagueId);

  if (!ready || team.loading) return <LoadingBlock rows={3} height={96} />;
  if (team.error || !team.data) return <ErrorState message={team.error ?? "Team not found"} onRetry={team.reload} />;

  const t = team.data;
  const mine = (matches.data ?? []).filter((m) => m.team1_id === t.id || m.team2_id === t.id);
  const time = (m: Match) => dayjs(m.match_date ?? m.updated_at).valueOf();
  const results = mine.filter((m) => m.status === "completed").sort((a, b) => time(b) - time(a));
  const upcoming = mine.filter((m) => m.status === "scheduled" || m.status === "live").sort((a, b) => time(a) - time(b));
  const form = results.slice(0, 5);
  const rank = sortStandings(leagueTeams.data ?? []).findIndex((x) => x.id === t.id) + 1;

  const squad = [...(players.data ?? [])].sort(
    (a, b) =>
      (POSITION_ORDER.indexOf(a.position?.toLowerCase()) + 1 || 9) - (POSITION_ORDER.indexOf(b.position?.toLowerCase()) + 1 || 9) ||
      a.name.localeCompare(b.name)
  );

  return (
    <>
      <Head>
        <title>{t.name} · FutsalFC</title>
      </Head>
      <PageHeader
        back={league.data ? { href: `/leagues/${league.data.id}`, label: league.data.name } : undefined}
        eyebrow={league.data?.name}
        title={
          <span className="flex items-center gap-4">
            <TeamCrest name={t.name} size={56} />
            <span className="min-w-0 truncate">{t.name}</span>
          </span>
        }
        right={
          form.length > 0 && (
            <div>
              <div className="mb-1 text-right text-xs uppercase tracking-wider text-muted">Form</div>
              <div className="flex gap-1">
                {[...form].reverse().map((m) => {
                  const o = outcomeFor(m, t.id);
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      title={`${m.team1.name} ${m.team1_score}-${m.team2_score} ${m.team2.name}`}
                      className={`font-display grid h-7 w-7 place-items-center rounded text-sm font-bold ${OUTCOME_CLS[o]}`}
                    >
                      {o}
                    </Link>
                  );
                })}
              </div>
            </div>
          )
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Position" value={rank ? `#${rank}` : "–"} hint={leagueTeams.data && `of ${leagueTeams.data.length}`} />
        <StatTile label="Points" value={t.points} hint={t.point_deduction ? `-${t.point_deduction} deducted` : undefined} />
        <StatTile label="Record" value={`${t.won}-${t.draw}-${t.lost}`} hint="W-D-L" />
        <StatTile label="Goals" value={`${t.goals_for}:${t.goals_against}`} hint="For : Against" />
        <StatTile label="Goal diff" value={t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <Section title="Upcoming">
            {matches.loading ? (
              <LoadingBlock rows={2} height={84} />
            ) : upcoming.length === 0 ? (
              <EmptyState title="No upcoming matches" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Results">
            {matches.loading ? (
              <LoadingBlock rows={2} height={84} />
            ) : results.length === 0 ? (
              <EmptyState title="No results yet" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {results.map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            )}
          </Section>

          {leagueTeams.data && leagueTeams.data.length > 0 && (
            <Section title="League table">
              <StandingsTable teams={leagueTeams.data} highlightId={t.id} />
            </Section>
          )}
        </div>

        <Section title="Squad">
          {players.loading ? (
            <LoadingBlock rows={6} height={36} />
          ) : players.error ? (
            <ErrorState message={players.error} onRetry={players.reload} />
          ) : squad.length === 0 ? (
            <EmptyState title="No players registered" />
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
              {squad.map((p) => (
                <li key={p.id}>
                  <Link href={`/players/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel-2">
                    <span className="w-9">
                      <PositionBadge position={p.position} />
                    </span>
                    <span className="truncate font-medium">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
