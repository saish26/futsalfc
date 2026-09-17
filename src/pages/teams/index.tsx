import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import { getLeagues, getTeams } from "@/services/api";
import { sortStandings } from "@/utils/helpers";
import Head from "next/head";
import Link from "next/link";

const ORDER: Record<string, number> = { active: 0, upcoming: 1, completed: 2 };

export default function TeamsPage() {
  const teams = useApi(getTeams);
  const leagues = useApi(getLeagues);

  const loading = teams.loading || leagues.loading;
  const error = teams.error || leagues.error;

  const groups = [...(leagues.data ?? [])]
    .sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3))
    .map((l) => ({ league: l, teams: sortStandings((teams.data ?? []).filter((t) => t.league_id === l.id)) }))
    .filter((g) => g.teams.length > 0);

  return (
    <>
      <Head>
        <title>Teams · FutsalFC</title>
      </Head>
      <PageHeader eyebrow="Clubs" title="Teams" subtitle="All teams, grouped by league." />

      {loading ? (
        <LoadingBlock rows={4} height={72} />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            teams.reload();
            leagues.reload();
          }}
        />
      ) : groups.length === 0 ? (
        <EmptyState title="No teams yet" />
      ) : (
        <div className="space-y-8">
          {groups.map(({ league, teams }) => (
            <section key={league.id}>
              <div className="mb-3 flex items-center gap-3">
                <Link href={`/leagues/${league.id}`} className="font-display text-2xl font-bold uppercase tracking-wide hover:text-pitch">
                  {league.name}
                </Link>
                <StatusBadge status={league.status} size="xs" />
              </div>
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
                        P{t.played} · {t.won}W {t.draw}D {t.lost}L
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display tabular text-2xl font-bold">{t.points}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted">pts</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
