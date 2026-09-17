import LeaderCard from "@/components/LeaderCard";
import MatchCard, { matchToRow } from "@/components/MatchCard";
import Section from "@/components/Section";
import StandingsTable from "@/components/StandingsTable";
import StatTile from "@/components/StatTile";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import {
  getCurrentGameWeek,
  getCurrentLeaderboards,
  getGameWeekMatches,
  getLeagueMatches,
  getLeagues,
  getLeagueTeams,
  getWallet,
} from "@/services/api";
import { formatDate, pickActiveLeague } from "@/utils/helpers";
import { IconBallFootball, IconShoe, IconSquareFilled } from "@tabler/icons-react";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";

const LEADER_ICONS: Record<string, React.ReactNode> = {
  Goal: <IconBallFootball className="text-pitch" size={22} />,
  Assist: <IconShoe className="text-sky-400" size={22} />,
  "Yellow card": <IconSquareFilled className="text-yellow-400" size={18} />,
  "Red card": <IconSquareFilled className="text-red-500" size={18} />,
};

const LEADER_LABELS: Record<string, string> = {
  Goal: "Top scorer",
  Assist: "Most assists",
  "Yellow card": "Most yellow cards",
  "Red card": "Most red cards",
};

export default function Home() {
  const leagues = useApi(getLeagues);
  const league = useMemo(() => pickActiveLeague(leagues.data ?? []), [leagues.data]);
  const leagueId = league?.id;

  const current = useApi(getCurrentGameWeek);
  const weekId = current.data?.week_id;
  const weekMatches = useApi(() => getGameWeekMatches(weekId!), [weekId], !!weekId);

  const teams = useApi(() => getLeagueTeams(leagueId!), [leagueId], !!leagueId);
  const matches = useApi(() => getLeagueMatches(leagueId!), [leagueId], !!leagueId);
  const leaders = useApi(getCurrentLeaderboards);
  const wallet = useApi(getWallet);

  const played = (matches.data ?? []).filter((m) => m.status === "completed");
  const recent = [...played]
    .sort((a, b) => dayjs(b.match_date ?? b.updated_at).valueOf() - dayjs(a.match_date ?? a.updated_at).valueOf())
    .slice(0, 4);
  const totalGoals = played.reduce((sum, m) => sum + m.team1_score + m.team2_score, 0);

  if (leagues.loading) return <LoadingBlock rows={4} height={120} />;
  if (leagues.error) return <ErrorState message={leagues.error} onRetry={leagues.reload} />;
  if (!league) return <EmptyState title="No leagues yet">Once a league is created it will show up here.</EmptyState>;

  return (
    <>
      <Head>
        <title>{league.name} · FutsalFC</title>
      </Head>

      {/* Hero */}
      <div className="pitch-lines relative mb-8 overflow-hidden rounded-2xl border border-line px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={league.status} />
          {current.data && (
            <span className="text-xs font-semibold uppercase tracking-widest text-green-200/80">
              Game week {current.data.week_number} of {league.game_weeks}
            </span>
          )}
        </div>
        <h1 className="font-display mt-3 text-5xl font-extrabold uppercase leading-none tracking-wide sm:text-6xl">
          {league.name}
        </h1>
        <p className="mt-2 text-sm text-green-100/70">
          {formatDate(league.start_date)} – {formatDate(league.end_date)}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/leagues/${league.id}?tab=fixtures`}
            className="rounded-md bg-pitch px-4 py-2 text-sm font-semibold text-ink hover:bg-green-400"
          >
            Fixtures
          </Link>
          <Link
            href={`/leagues/${league.id}?tab=standings`}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            Standings
          </Link>
          <Link
            href={`/leagues/${league.id}?tab=stats`}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            Player stats
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Teams" value={teams.data?.length ?? "–"} />
        <StatTile label="Matches played" value={matches.data ? played.length : "–"} hint={matches.data && `of ${matches.data.length}`} />
        <StatTile label="Goals scored" value={matches.data ? totalGoals : "–"} hint={played.length ? `${(totalGoals / played.length).toFixed(1)} per match` : undefined} />
        <StatTile label="Club wallet" value={wallet.data ? `Rs ${Number(wallet.data.amount).toLocaleString()}` : "–"} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <Section
            title={current.data ? `Game week ${current.data.week_number}` : "This week"}
            action={weekId ? { href: `/gameweeks/${weekId}`, label: "Week details" } : undefined}
          >
            {current.loading || weekMatches.loading ? (
              <LoadingBlock rows={3} height={84} />
            ) : !current.data ? (
              <EmptyState title="No upcoming game week">Every game week in the active league is completed.</EmptyState>
            ) : weekMatches.error ? (
              <ErrorState message={weekMatches.error} onRetry={weekMatches.reload} />
            ) : (weekMatches.data ?? []).length === 0 ? (
              <EmptyState title="No matches scheduled this week" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {weekMatches.data!.map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Latest results" action={{ href: `/leagues/${league.id}?tab=results`, label: "All results" }}>
            {matches.loading ? (
              <LoadingBlock rows={2} height={84} />
            ) : recent.length === 0 ? (
              <EmptyState title="No results yet" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recent.map((m) => (
                  <MatchCard key={m.id} match={matchToRow(m)} />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Table" action={{ href: `/leagues/${league.id}?tab=standings`, label: "Full table" }}>
            {teams.loading ? (
              <LoadingBlock rows={5} height={32} />
            ) : teams.error ? (
              <ErrorState message={teams.error} onRetry={teams.reload} />
            ) : (teams.data ?? []).length === 0 ? (
              <EmptyState title="No teams yet" />
            ) : (
              <StandingsTable teams={teams.data!} compact />
            )}
          </Section>

          <Section title="Leaders">
            {leaders.loading ? (
              <LoadingBlock rows={4} height={64} />
            ) : (leaders.data ?? []).length === 0 ? (
              <EmptyState title="No leaderboard yet" />
            ) : (
              <div className="space-y-3">
                {leaders.data!.map((l) => (
                  <LeaderCard
                    key={l.label}
                    label={LEADER_LABELS[l.label] ?? l.label}
                    icon={LEADER_ICONS[l.label]}
                    value={l.value}
                    playerName={l.player_name}
                    teamName={l.team_name}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
