import MatchCard, { matchToRow } from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import StatTile from "@/components/StatTile";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { getGameWeek, getGameWeekMatches, getLeague, getLeagueGameWeeks } from "@/services/api";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function GameWeekPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const week = useApi(() => getGameWeek(id!), [id], ready);
  const matches = useApi(() => getGameWeekMatches(id!), [id], ready);
  const leagueId = week.data?.league_id;
  const league = useApi(() => getLeague(leagueId!), [leagueId], !!leagueId);
  const allWeeks = useApi(() => getLeagueGameWeeks(leagueId!), [leagueId], !!leagueId);

  if (!ready || week.loading) return <LoadingBlock rows={3} height={96} />;
  if (week.error || !week.data) return <ErrorState message={week.error ?? "Game week not found"} onRetry={week.reload} />;

  const w = week.data;
  const weeks = allWeeks.data ?? [];
  const idx = weeks.findIndex((x) => x.id === w.id);
  const prev = idx > 0 ? weeks[idx - 1] : undefined;
  const next = idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : undefined;

  const list = [...(matches.data ?? [])].sort(
    (a, b) => dayjs(a.match_date ?? 0).valueOf() - dayjs(b.match_date ?? 0).valueOf()
  );
  const completed = list.filter((m) => m.status === "completed");
  const goals = completed.reduce((s, m) => s + m.team1_score + m.team2_score, 0);
  const biggest = [...completed].sort(
    (a, b) => Math.abs(b.team1_score - b.team2_score) - Math.abs(a.team1_score - a.team2_score)
  )[0];

  return (
    <>
      <Head>
        <title>Game week {w.week_number} · FutsalFC</title>
      </Head>
      <PageHeader
        back={league.data ? { href: `/leagues/${league.data.id}?tab=fixtures`, label: league.data.name } : undefined}
        eyebrow={league.data?.name ?? "Game week"}
        title={`Game week ${w.week_number}`}
        subtitle={<StatusBadge status={w.status} />}
        right={
          <div className="flex gap-2">
            <WeekNav week={prev} dir="prev" />
            <WeekNav week={next} dir="next" />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Matches" value={list.length} />
        <StatTile label="Completed" value={completed.length} />
        <StatTile label="Goals" value={goals} hint={completed.length ? `${(goals / completed.length).toFixed(1)} per match` : undefined} />
        <StatTile
          label="Biggest margin"
          value={biggest ? `${biggest.team1_score}-${biggest.team2_score}` : "–"}
          hint={biggest ? `${biggest.team1.name} v ${biggest.team2.name}` : undefined}
        />
      </div>

      {matches.loading ? (
        <LoadingBlock rows={3} height={84} />
      ) : matches.error ? (
        <ErrorState message={matches.error} onRetry={matches.reload} />
      ) : list.length === 0 ? (
        <EmptyState title="No matches in this game week" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <MatchCard key={m.id} match={matchToRow(m)} />
          ))}
        </div>
      )}
    </>
  );
}

function WeekNav({ week, dir }: { week?: { id: string; week_number: number }; dir: "prev" | "next" }) {
  const cls = "flex items-center gap-1 rounded-md border border-line bg-panel px-3 py-1.5 text-sm";
  const content =
    dir === "prev" ? (
      <>
        <IconChevronLeft size={16} /> {week ? `GW ${week.week_number}` : "Prev"}
      </>
    ) : (
      <>
        {week ? `GW ${week.week_number}` : "Next"} <IconChevronRight size={16} />
      </>
    );
  if (!week) return <span className={`${cls} cursor-not-allowed opacity-40`}>{content}</span>;
  return (
    <Link href={`/gameweeks/${week.id}`} className={`${cls} hover:border-pitch/50 hover:text-pitch`}>
      {content}
    </Link>
  );
}
