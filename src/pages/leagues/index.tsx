import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { getLeagues } from "@/services/api";
import { formatDate } from "@/utils/helpers";
import { IconCalendar, IconChevronRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";

const ORDER: Record<string, number> = { active: 0, upcoming: 1, completed: 2 };

export default function LeaguesPage() {
  const { data, loading, error, reload } = useApi(getLeagues);

  const leagues = [...(data ?? [])].sort(
    (a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3) || dayjs(b.start_date).valueOf() - dayjs(a.start_date).valueOf()
  );

  return (
    <>
      <Head>
        <title>Leagues · FutsalFC</title>
      </Head>
      <PageHeader eyebrow="Competitions" title="Leagues" subtitle="Every season, past and present." />

      {loading ? (
        <LoadingBlock rows={3} height={96} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : leagues.length === 0 ? (
        <EmptyState title="No leagues yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {leagues.map((l) => (
            <Link
              key={l.id}
              href={`/leagues/${l.id}`}
              className={`group flex items-center gap-4 rounded-xl border bg-panel px-5 py-4 transition-colors hover:bg-panel-2 ${
                l.status === "active" ? "border-pitch/40" : "border-line"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1">
                  <StatusBadge status={l.status} size="xs" />
                </div>
                <div className="font-display truncate text-2xl font-bold uppercase tracking-wide">{l.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <IconCalendar size={14} /> {formatDate(l.start_date)} – {formatDate(l.end_date)}
                  </span>
                  <span>{l.game_weeks} game weeks</span>
                </div>
              </div>
              <IconChevronRight className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pitch" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
