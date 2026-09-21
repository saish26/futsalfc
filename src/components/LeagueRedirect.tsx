import { useApi } from "@/hooks/useApi";
import { getLeagues } from "@/services/api";
import { pickActiveLeague } from "@/utils/helpers";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { EmptyState, ErrorState, LoadingBlock } from "./States";

/**
 * Sends shortcut routes like /fixtures and /table to the matching tab of the
 * current league, so those views are reachable from the main nav.
 */
export default function LeagueRedirect({ tab }: { tab: "fixtures" | "standings" }) {
  const router = useRouter();
  const { data, loading, error, reload } = useApi(getLeagues);
  const league = pickActiveLeague(data ?? []);

  useEffect(() => {
    if (league) router.replace(`/leagues/${league.id}?tab=${tab}`);
  }, [league, tab, router]);

  if (loading) return <LoadingBlock rows={3} height={80} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!league) return <EmptyState title="No leagues yet">Fixtures appear once a league is created.</EmptyState>;
  return <LoadingBlock rows={3} height={80} />;
}
