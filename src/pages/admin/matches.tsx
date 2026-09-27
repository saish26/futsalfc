import AdminLayout from "@/components/admin/AdminLayout";
import { Panel } from "@/components/Section";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import {
  createMatch,
  deleteMatch,
  getLeagueGameWeeks,
  getLeagueMatches,
  getLeagues,
  getLeagueTeams,
} from "@/services/api";
import type { Match, MatchInput } from "@/types";
import { runAction } from "@/utils/actions";
import { formatKickoff, pickActiveLeague } from "@/utils/helpers";
import { ActionIcon, Button, Modal, Select } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { IconPlus, IconSettings, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";

export default function AdminMatchesPage() {
  const leagues = useApi(getLeagues);
  const [leagueId, setLeagueId] = useState<string>();
  const selectedLeague = leagueId ?? pickActiveLeague(leagues.data ?? [])?.id;

  const matches = useApi(() => getLeagueMatches(selectedLeague!), [selectedLeague], !!selectedLeague);
  const teams = useApi(() => getLeagueTeams(selectedLeague!), [selectedLeague], !!selectedLeague);
  const weeks = useApi(() => getLeagueGameWeeks(selectedLeague!), [selectedLeague], !!selectedLeague);

  const [creating, setCreating] = useState(false);

  const weekLabel = (m: Match) => {
    const w = (weeks.data ?? []).find((x) => x.id === m.game_week_id);
    return w ? `GW ${w.week_number}` : "No week";
  };

  const confirmDelete = (m: Match) =>
    modals.openConfirmModal({
      title: "Delete match?",
      children: (
        <p className="text-sm text-muted">
          {m.team1?.name} v {m.team2?.name} will be removed permanently.
        </p>
      ),
      labels: { confirm: "Delete match", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deleteMatch(m.id), { success: "Match deleted" })) matches.reload();
      },
    });

  const sorted = [...(matches.data ?? [])].sort(
    (a, b) => dayjs(a.match_date ?? 0).valueOf() - dayjs(b.match_date ?? 0).valueOf()
  );

  return (
    <AdminLayout
      title="Matches"
      subtitle="Schedule matches, then open one to record goals, cards and the result."
      right={
        <div className="flex items-end gap-2">
          <Select
            label="League"
            size="sm"
            w={200}
            value={selectedLeague ?? null}
            data={(leagues.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
            onChange={(v) => v && setLeagueId(v)}
            allowDeselect={false}
          />
          <Button leftSection={<IconPlus size={16} />} disabled={!selectedLeague} onClick={() => setCreating(true)}>
            New match
          </Button>
        </div>
      }
    >
      {matches.loading ? (
        <LoadingBlock rows={4} height={56} />
      ) : matches.error ? (
        <ErrorState message={matches.error} onRetry={matches.reload} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No matches yet">Create one, or generate fixtures from the Leagues tab.</EmptyState>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => (
            <Panel key={m.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                {weekLabel(m)}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TeamCrest name={m.team1?.name} size={26} />
                <span className="min-w-0 truncate text-sm font-medium">{m.team1?.name}</span>
                <span className="font-display tabular px-2 text-lg font-bold">
                  {m.status === "scheduled" ? "v" : `${m.team1_score}-${m.team2_score}`}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{m.team2?.name}</span>
                <TeamCrest name={m.team2?.name} size={26} />
              </div>
              <span className="hidden text-xs text-muted sm:block">{formatKickoff(m.match_date)}</span>
              <StatusBadge status={m.status} size="xs" />
              <Button
                component={Link}
                href={`/admin/matches/${m.id}`}
                size="xs"
                variant="light"
                leftSection={<IconSettings size={14} />}
              >
                Manage
              </Button>
              <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(m)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Panel>
          ))}
        </div>
      )}

      <CreateMatchModal
        opened={creating}
        onClose={() => setCreating(false)}
        leagueId={selectedLeague}
        teams={(teams.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
        weeks={(weeks.data ?? []).map((w) => ({ value: w.id, label: `Game week ${w.week_number}` }))}
        onCreated={() => {
          setCreating(false);
          matches.reload();
        }}
      />
    </AdminLayout>
  );
}

function CreateMatchModal({
  opened,
  onClose,
  leagueId,
  teams,
  weeks,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  leagueId?: string;
  teams: { value: string; label: string }[];
  weeks: { value: string; label: string }[];
  onCreated: () => void;
}) {
  const [team1, setTeam1] = useState<string | null>(null);
  const [team2, setTeam2] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!leagueId || !team1 || !team2) return;
    const input: MatchInput = {
      league_id: leagueId,
      team1_id: team1,
      team2_id: team2,
      game_week_id: week,
      match_date: date ? dayjs(date).toISOString() : null,
      status: "scheduled",
    };
    setBusy(true);
    const done = await runAction(() => createMatch(input), { success: "Match created" });
    setBusy(false);
    if (done) {
      setTeam1(null);
      setTeam2(null);
      setWeek(null);
      setDate(null);
      onCreated();
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New match" centered>
      <div className="space-y-3">
        <Select label="Home team" data={teams} value={team1} onChange={setTeam1} searchable required />
        <Select
          label="Away team"
          data={teams.filter((t) => t.value !== team1)}
          value={team2}
          onChange={setTeam2}
          searchable
          required
        />
        <Select label="Game week" data={weeks} value={week} onChange={setWeek} clearable />
        <DateTimePicker label="Kick-off" value={date} onChange={(v) => setDate(v ? new Date(v) : null)} clearable />
        <Button fullWidth loading={busy} disabled={!team1 || !team2 || team1 === team2} onClick={submit}>
          Create match
        </Button>
      </div>
    </Modal>
  );
}
