import PositionBadge from "@/components/PositionBadge";
import { Panel } from "@/components/Section";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getGameWeek, getMatch, getMatchEvents, getMatchLineup, getTeamPlayers } from "@/services/api";
import type { LineupPlayer, MatchEvent, TeamPlayer } from "@/types";
import { formatKickoff } from "@/utils/helpers";
import { Badge } from "@mantine/core";
import { IconBallFootball, IconHandStop, IconSquareFilled } from "@tabler/icons-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const POSITION_ORDER = ["goalkeeper", "defender", "midfielder", "striker"];
const byPosition = <T extends { position: string; name: string }>(a: T, b: T) =>
  (POSITION_ORDER.indexOf(a.position?.toLowerCase()) + 1 || 9) - (POSITION_ORDER.indexOf(b.position?.toLowerCase()) + 1 || 9) ||
  a.name.localeCompare(b.name);

export default function MatchDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const match = useApi(() => getMatch(id!), [id], ready);
  const events = useApi(() => getMatchEvents(id!), [id], ready);
  const lineup = useApi(() => getMatchLineup(id!), [id], ready);

  const m = match.data;
  const weekId = m?.game_week_id ?? undefined;
  const week = useApi(() => getGameWeek(weekId!), [weekId], !!weekId);

  // When no lineup was submitted, fall back to the registered squads.
  const noLineup = !lineup.loading && (lineup.data ?? []).length === 0;
  const homeSquad = useApi(() => getTeamPlayers(m!.team1_id), [m?.team1_id], !!m && noLineup);
  const awaySquad = useApi(() => getTeamPlayers(m!.team2_id), [m?.team2_id], !!m && noLineup);

  if (!ready || match.loading) return <LoadingBlock rows={3} height={120} />;
  if (match.error || !m) return <ErrorState message={match.error ?? "Match not found"} onRetry={match.reload} />;

  const showScore = m.status === "completed" || m.status === "live";
  const evs = events.data?.events ?? [];
  const homeLineup = (lineup.data ?? []).filter((p) => p.team_id === m.team1_id);
  const awayLineup = (lineup.data ?? []).filter((p) => p.team_id === m.team2_id);

  return (
    <>
      <Head>
        <title>
          {m.team1.name} vs {m.team2.name} · FutsalFC
        </title>
      </Head>

      <Link href={`/leagues/${m.league_id}?tab=fixtures`} className="mb-3 inline-block text-sm text-muted hover:text-white">
        ← {m.league?.name ?? "League"} fixtures
      </Link>

      {/* Scoreboard */}
      <div className="pitch-lines mb-6 rounded-2xl border border-line px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-xs text-green-100/80">
          {week.data && (
            <Link href={`/gameweeks/${week.data.id}`} className="font-semibold uppercase tracking-widest hover:text-white">
              Game week {week.data.week_number}
            </Link>
          )}
          {week.data && <span>·</span>}
          <span>{formatKickoff(m.match_date)}</span>
          <StatusBadge status={m.status} size="xs" />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <TeamSide id={m.team1_id} name={m.team1.name} loans={m.team1_loan_count} />
          <div className="font-display tabular text-center text-5xl font-extrabold sm:text-7xl">
            {showScore ? (
              <>
                {m.team1_score}
                <span className="mx-2 text-green-100/40 sm:mx-4">:</span>
                {m.team2_score}
              </>
            ) : (
              <span className="text-3xl text-green-100/60 sm:text-4xl">VS</span>
            )}
          </div>
          <TeamSide id={m.team2_id} name={m.team2.name} loans={m.team2_loan_count} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Events */}
        <Panel className="p-4 sm:p-5">
          <h2 className="font-display mb-4 text-xl font-bold uppercase tracking-wide">Match events</h2>
          {events.loading ? (
            <LoadingBlock rows={3} height={36} />
          ) : events.error ? (
            <ErrorState message={events.error} onRetry={events.reload} />
          ) : evs.length === 0 ? (
            <EmptyState title="No events recorded" />
          ) : (
            <ol className="space-y-2">
              {evs.map((e, i) => (
                <EventRow key={i} event={e} />
              ))}
            </ol>
          )}
        </Panel>

        {/* Lineups */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">{noLineup ? "Squads" : "Lineups"}</h2>
            {noLineup && <span className="text-xs text-muted">No lineup submitted, showing registered squads</span>}
          </div>
          {lineup.loading || homeSquad.loading || awaySquad.loading ? (
            <LoadingBlock rows={4} height={32} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <PlayerList title={m.team1.name} players={noLineup ? homeSquad.data ?? [] : homeLineup} />
              <PlayerList title={m.team2.name} players={noLineup ? awaySquad.data ?? [] : awayLineup} />
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function TeamSide({ id, name, loans }: { id: string; name: string; loans: number }) {
  return (
    <Link href={`/teams/${id}`} className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-pitch">
      <TeamCrest name={name} size={64} />
      <span className="font-display line-clamp-2 text-lg font-bold uppercase leading-tight sm:text-2xl">{name}</span>
      {loans > 0 && (
        <Badge size="xs" variant="light" color="yellow">
          {loans} loan{loans > 1 ? "s" : ""}
        </Badge>
      )}
    </Link>
  );
}

function EventIcon({ type }: { type: MatchEvent["event_type"] }) {
  switch (type) {
    case "goal":
      return <IconBallFootball size={18} className="text-pitch" />;
    case "yellow_card":
      return <IconSquareFilled size={14} className="text-yellow-400" />;
    case "red_card":
      return <IconSquareFilled size={14} className="text-red-500" />;
    case "penalty_save":
      return <IconHandStop size={18} className="text-sky-400" />;
    default:
      return null;
  }
}

const EVENT_LABEL: Record<string, string> = {
  goal: "Goal",
  yellow_card: "Yellow card",
  red_card: "Red card",
  penalty_save: "Penalty save",
};

function EventRow({ event }: { event: MatchEvent }) {
  const home = event.is_home_team;
  const body = (
    <div className={`min-w-0 ${home ? "text-right" : "text-left"}`}>
      <div className="truncate font-medium">{event.player_name || (event.event_type === "goal" ? "Unassigned goal" : "Unknown")}</div>
      <div className="truncate text-xs text-muted">
        {EVENT_LABEL[event.event_type] ?? event.event_type}
        {event.assist_player_name ? ` · assist ${event.assist_player_name}` : ""}
      </div>
    </div>
  );
  return (
    <li className="grid grid-cols-[1fr_32px_1fr] items-center gap-2 rounded-lg bg-panel-2/60 px-3 py-2">
      {home ? body : <span />}
      <span className="grid place-items-center">
        <EventIcon type={event.event_type} />
      </span>
      {home ? <span /> : body}
    </li>
  );
}

function PlayerList({ title, players }: { title: string; players: (LineupPlayer | TeamPlayer)[] }) {
  const sorted = [...players].sort(byPosition);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <TeamCrest name={title} size={22} />
        <span className="truncate text-sm font-semibold">{title}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">No players</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {sorted.map((p) => {
            const pid = "player_id" in p ? p.player_id : p.id;
            const loan = "is_loan" in p && p.is_loan;
            return (
              <li key={pid} className="flex items-center gap-2 px-3 py-2 text-sm">
                <PositionBadge position={p.position} />
                <Link href={`/players/${pid}`} className="min-w-0 flex-1 truncate hover:text-pitch">
                  {p.name}
                </Link>
                {loan && (
                  <Badge size="xs" variant="outline" color="yellow" title={(p as LineupPlayer).loan_from_name}>
                    Loan
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
