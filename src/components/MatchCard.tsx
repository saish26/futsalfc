import type { GameWeekMatchSummary, Match, MatchStatus } from "@/types";
import { formatKickoff } from "@/utils/helpers";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import TeamCrest from "./TeamCrest";

export interface MatchRow {
  id: string;
  homeId: string;
  homeName: string;
  awayId: string;
  awayName: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  date: string | null;
}

export const matchToRow = (m: Match): MatchRow => ({
  id: m.id,
  homeId: m.team1_id,
  homeName: m.team1?.name ?? "Home",
  awayId: m.team2_id,
  awayName: m.team2?.name ?? "Away",
  homeScore: m.team1_score,
  awayScore: m.team2_score,
  status: m.status,
  date: m.match_date,
});

/** Fixture summaries carry no scores, so borrow them from the full match list when available. */
export const summaryToRow = (s: GameWeekMatchSummary, full?: Match): MatchRow => ({
  id: s.matchId,
  homeId: s.hometeamid,
  homeName: s.hometeamname,
  awayId: s.awayteamid,
  awayName: s.awayteamname,
  homeScore: full?.team1_score,
  awayScore: full?.team2_score,
  status: s.status,
  date: s.kickoff,
});

export default function MatchCard({ match }: { match: MatchRow }) {
  const showScore = (match.status === "completed" || match.status === "live") && match.homeScore !== undefined;
  const homeWon = showScore && match.homeScore! > match.awayScore!;
  const awayWon = showScore && match.awayScore! > match.homeScore!;

  const side = (name: string, score: number | undefined, won: boolean, lost: boolean) => (
    <div className="flex items-center gap-3">
      <TeamCrest name={name} size={28} />
      <span className={`min-w-0 flex-1 truncate font-semibold ${lost ? "text-muted" : ""}`}>{name}</span>
      <span
        className={`font-display tabular w-7 text-right text-2xl font-bold leading-none ${
          won ? "text-pitch" : lost ? "text-muted" : ""
        }`}
      >
        {showScore ? score : ""}
      </span>
    </div>
  );

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-pitch/50 hover:bg-panel-2"
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{formatKickoff(match.date)}</span>
        <StatusBadge status={match.status} size="xs" />
      </div>
      <div className="space-y-2">
        {side(match.homeName, match.homeScore, homeWon, awayWon)}
        {side(match.awayName, match.awayScore, awayWon, homeWon)}
      </div>
    </Link>
  );
}
