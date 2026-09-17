import LeagueStats from "@/components/LeagueStats";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import { getLeagues } from "@/services/api";
import { pickActiveLeague } from "@/utils/helpers";
import { Select } from "@mantine/core";
import Head from "next/head";
import { useRouter } from "next/router";

export default function StatsPage() {
  const router = useRouter();
  const leagues = useApi(getLeagues);

  const fallback = pickActiveLeague(leagues.data ?? [])?.id;
  const leagueId = (router.query.league as string | undefined) ?? fallback;

  const onChange = (value: string | null) =>
    value && router.replace({ pathname: "/stats", query: { league: value } }, undefined, { shallow: true });

  return (
    <>
      <Head>
        <title>Player stats · FutsalFC</title>
      </Head>
      <PageHeader
        eyebrow="Leaderboards"
        title="Player stats"
        subtitle="Goals, assists, clean sheets and fantasy points."
        right={
          leagues.data &&
          leagues.data.length > 0 && (
            <Select
              label="League"
              value={leagueId ?? null}
              onChange={onChange}
              allowDeselect={false}
              data={leagues.data.map((l) => ({ value: l.id, label: l.name }))}
              className="w-60"
            />
          )
        }
      />

      {leagues.loading || !router.isReady ? (
        <LoadingBlock rows={4} height={64} />
      ) : leagues.error ? (
        <ErrorState message={leagues.error} onRetry={leagues.reload} />
      ) : !leagueId ? (
        <EmptyState title="No leagues yet" />
      ) : (
        <LeagueStats key={leagueId} leagueId={leagueId} />
      )}
    </>
  );
}
