import LeagueStats from "@/components/LeagueStats";
import MatchCard, { matchToRow, summaryToRow } from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import StandingsTable from "@/components/StandingsTable";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getLeague, getLeagueFixtures, getLeagueMatches, getLeagueTeams } from "@/services/api";
import type { GameWeekSummary, Match, Team } from "@/types";
import { formatDate } from "@/utils/helpers";
import { Tabs } from "@mantine/core";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

const TABS = ["standings", "fixtures", "results", "stats", "teams"] as const;
type Tab = (typeof TABS)[number];

export default function LeagueDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const tabParam = router.query.tab as Tab | undefined;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "standings";
  const setTab = (t: string | null) =>
    router.replace({ pathname: router.pathname, query: { id, tab: t } }, undefined, { shallow: true, scroll: false });

  const league = useApi(() => getLeague(id!), [id], ready);
  const teams = useApi(() => getLeagueTeams(id!), [id], ready);
  const matches = useApi(() => getLeagueMatches(id!), [id], ready);
  const fixtures = useApi(() => getLeagueFixtures(id!), [id], ready);

  if (!ready || league.loading) return <LoadingBlock rows={4} height={80} />;
  if (league.error || !league.data) return <ErrorState message={league.error ?? "League not found"} onRetry={league.reload} />;

  const l = league.data;

  return (
    <>
      <Head>
        <title>{l.name} · FutsalFC</title>
      </Head>
      <PageHeader
        back={{ href: "/leagues", label: "All leagues" }}
        eyebrow={<StatusBadge status={l.status} size="xs" />}
        title={l.name}
        subtitle={`${formatDate(l.start_date)} – ${formatDate(l.end_date)} · ${l.game_weeks} game weeks`}
      />

      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List className="mb-6 flex-nowrap overflow-x-auto">
          <Tabs.Tab value="standings">Standings</Tabs.Tab>
          <Tabs.Tab value="fixtures">Fixtures</Tabs.Tab>
          <Tabs.Tab value="results">Results</Tabs.Tab>
          <Tabs.Tab value="stats">Player stats</Tabs.Tab>
          <Tabs.Tab value="teams">Teams</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="standings">
          {teams.loading ? (
            <LoadingBlock rows={6} height={40} />
          ) : teams.error ? (
            <ErrorState message={teams.error} onRetry={teams.reload} />
          ) : (teams.data ?? []).length === 0 ? (
            <EmptyState title="No teams in this league yet" />
          ) : (
            <StandingsTable teams={teams.data!} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="fixtures">
          {fixtures.loading || matches.loading ? (
            <LoadingBlock rows={4} height={84} />
          ) : fixtures.error ? (
            <ErrorState message={fixtures.error} onRetry={fixtures.reload} />
          ) : (
            <Fixtures weeks={fixtures.data ?? []} matches={matches.data ?? []} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="results">
          {matches.loading ? (
            <LoadingBlock rows={4} height={84} />
          ) : matches.error ? (
            <ErrorState message={matches.error} onRetry={matches.reload} />
          ) : (
            <Results matches={matches.data ?? []} weeks={fixtures.data ?? []} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="stats">
          <LeagueStats leagueId={l.id} />
        </Tabs.Panel>

        <Tabs.Panel value="teams">
          {teams.loading ? (
            <LoadingBlock rows={3} height={72} />
          ) : (
            <TeamsGrid teams={teams.data ?? []} />
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

function Fixtures({ weeks, matches }: { weeks: GameWeekSummary[]; matches: Match[] }) {
  const byId = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // Default to the first week that still has unfinished matches.
  const defaultWeek = useMemo(() => {
    const open = weeks.find((w) => w.matches.some((m) => m.status !== "completed" && m.status !== "cancelled"));
    return (open ?? weeks[weeks.length - 1])?.week_id;
  }, [weeks]);
  const [picked, setSelected] = useState<string>();
  const selected = picked ?? defaultWeek;

  if (weeks.length === 0) return <EmptyState title="Fixtures haven't been generated yet" />;

  const week = weeks.find((w) => w.week_id === selected) ?? weeks[0];

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {weeks.map((w) => {
          const done = w.matches.length > 0 && w.matches.every((m) => m.status === "completed" || m.status === "cancelled");
          const live = w.matches.some((m) => m.status === "live");
          const active = w.week_id === week.week_id;
          return (
            <button
              key={w.week_id}
              onClick={() => setSelected(w.week_id)}
              className={`relative shrink-0 rounded-lg border px-3 py-2 text-center transition-colors ${
                active ? "border-pitch bg-pitch/15 text-white" : "border-line bg-panel text-muted hover:text-white"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider">Week</div>
              <div className="font-display text-xl font-bold leading-none">{w.week_number}</div>
              {(done || live) && (
                <span
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${live ? "live-dot bg-red-500" : "bg-muted"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold uppercase tracking-wide">Game week {week.week_number}</h3>
        <Link href={`/gameweeks/${week.week_id}`} className="text-sm font-medium text-pitch hover:underline">
          Week details →
        </Link>
      </div>

      {week.matches.length === 0 ? (
        <EmptyState title="No matches in this week" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {week.matches.map((m) => (
            <MatchCard key={m.matchId} match={summaryToRow(m, byId.get(m.matchId))} />
          ))}
        </div>
      )}
    </div>
  );
}

function Results({ matches, weeks }: { matches: Match[]; weeks: GameWeekSummary[] }) {
  const weekNumber = useMemo(() => new Map(weeks.map((w) => [w.week_id, w.week_number])), [weeks]);

  const groups = useMemo(() => {
    const done = matches
      .filter((m) => m.status === "completed")
      .sort((a, b) => dayjs(b.match_date ?? b.updated_at).valueOf() - dayjs(a.match_date ?? a.updated_at).valueOf());
    const map = new Map<string, Match[]>();
    for (const m of done) {
      const n = m.game_week_id ? weekNumber.get(m.game_week_id) : undefined;
      const key = n ? `Game week ${n}` : "Other matches";
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()];
  }, [matches, weekNumber]);

  if (groups.length === 0) return <EmptyState title="No results yet">Completed matches will appear here.</EmptyState>;

  return (
    <div className="space-y-6">
      {groups.map(([label, ms]) => (
        <div key={label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{label}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {ms.map((m) => (
              <MatchCard key={m.id} match={matchToRow(m)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamsGrid({ teams }: { teams: Team[] }) {
  if (teams.length === 0) return <EmptyState title="No teams in this league yet" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((t) => (
        <Link
          key={t.id}
          href={`/teams/${t.id}`}
          className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 hover:border-pitch/50 hover:bg-panel-2"
        >
          <TeamCrest name={t.name} size={44} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{t.name}</div>
            <div className="tabular text-xs text-muted">
              {t.won}W · {t.draw}D · {t.lost}L
            </div>
          </div>
          <div className="text-right">
            <div className="font-display tabular text-2xl font-bold">{t.points}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted">pts</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
