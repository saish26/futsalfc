import AdminLayout from "@/components/admin/AdminLayout";
import PlayerChips from "@/components/admin/PlayerChips";
import PositionBadge from "@/components/PositionBadge";
import { Panel } from "@/components/Section";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import {
  addLineupPlayers,
  getMatch,
  getMatchCards,
  getMatchEvents,
  getMatchLineup,
  getMatchPenaltySaves,
  getTeamPlayers,
  removeLineupPlayer,
  submitCard,
  submitGoal,
  submitPenaltySave,
  submitResult,
  updateLoanCount,
  updateMatchStatus,
} from "@/services/api";
import type { Match, MatchStatus, TeamPlayer } from "@/types";
import { runAction } from "@/utils/actions";
import { formatKickoff, isOwnGoalEvent } from "@/utils/helpers";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  Tabs,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { modals } from "@mantine/modals";
import {
  IconAlertCircle,
  IconBallFootball,
  IconHandStop,
  IconSquareFilled,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

const STATUSES: MatchStatus[] = ["scheduled", "live", "completed", "cancelled"];

interface TeamOption {
  value: string;
  label: string;
}

export default function AdminMatchConsole() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const ready = router.isReady && !!id;

  const match = useApi(() => getMatch(id!), [id], ready);
  const events = useApi(() => getMatchEvents(id!), [id], ready);
  const lineup = useApi(() => getMatchLineup(id!), [id], ready);
  const cards = useApi(() => getMatchCards(id!), [id], ready);
  const saves = useApi(() => getMatchPenaltySaves(id!), [id], ready);

  const m = match.data;
  const homeSquad = useApi(() => getTeamPlayers(m!.team1_id), [m?.team1_id], !!m);
  const awaySquad = useApi(() => getTeamPlayers(m!.team2_id), [m?.team2_id], !!m);

  const reloadAll = () => {
    match.reload();
    events.reload();
    cards.reload();
    saves.reload();
  };

  if (!ready || match.loading)
    return (
      <AdminLayout title="Match">
        <LoadingBlock rows={3} height={96} />
      </AdminLayout>
    );
  if (match.error || !m)
    return (
      <AdminLayout title="Match">
        <ErrorState message={match.error ?? "Match not found"} onRetry={match.reload} />
      </AdminLayout>
    );

  const finished = m.status === "completed" || m.status === "cancelled";
  const teamOptions: TeamOption[] = [
    { value: m.team1_id, label: m.team1?.name ?? "Home" },
    { value: m.team2_id, label: m.team2?.name ?? "Away" },
  ];
  const squadFor = (teamId: string | null) =>
    teamId === m.team1_id ? (homeSquad.data ?? []) : teamId === m.team2_id ? (awaySquad.data ?? []) : [];
  const otherTeamId = (teamId: string | null) =>
    teamId === m.team1_id ? m.team2_id : teamId === m.team2_id ? m.team1_id : null;

  const changeStatus = (status: MatchStatus) => {
    const apply = async () => {
      if (await runAction(() => updateMatchStatus(m.id, status), { success: `Match marked ${status}` })) reloadAll();
    };
    if (status === "completed") {
      modals.openConfirmModal({
        title: "Complete this match?",
        children: (
          <p className="text-sm text-muted">
            Completing applies the result to the league table and player stats. The API blocks further edits afterwards.
          </p>
        ),
        labels: { confirm: "Complete match", cancel: "Cancel" },
        onConfirm: apply,
      });
      return;
    }
    apply();
  };

  return (
    <AdminLayout
      title={`${m.team1?.name ?? "Home"} v ${m.team2?.name ?? "Away"}`}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge status={m.status} size="xs" />
          <span>{formatKickoff(m.match_date)}</span>
          <Link href={`/matches/${m.id}`} className="text-pitch hover:underline">
            public page →
          </Link>
        </span>
      }
      right={
        <div className="text-right">
          <div className="font-display tabular text-4xl font-extrabold">
            {m.team1_score} : {m.team2_score}
          </div>
          <Select
            size="xs"
            w={140}
            mt={6}
            value={m.status}
            data={STATUSES}
            allowDeselect={false}
            onChange={(v) => v && v !== m.status && changeStatus(v as MatchStatus)}
          />
        </div>
      }
    >
      {finished && (
        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />} className="mb-6">
          This match is {m.status}. The API rejects new goals, cards and lineup changes — reopen it by setting the
          status back if you need to correct something.
        </Alert>
      )}

      <Tabs defaultValue="events" keepMounted={false}>
        <Tabs.List className="mb-6 flex-nowrap overflow-x-auto">
          <Tabs.Tab value="events" leftSection={<IconBallFootball size={15} />}>
            Goals & cards
          </Tabs.Tab>
          <Tabs.Tab value="result">Result</Tabs.Tab>
          <Tabs.Tab value="lineups" leftSection={<IconUsers size={15} />}>
            Lineups
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="events">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <GoalForm
                match={m}
                teamOptions={teamOptions}
                squadFor={squadFor}
                otherTeamId={otherTeamId}
                disabled={finished}
                onDone={reloadAll}
              />
              <CardForm match={m} teamOptions={teamOptions} squadFor={squadFor} disabled={finished} onDone={reloadAll} />
              <PenaltySaveForm
                match={m}
                teamOptions={teamOptions}
                squadFor={squadFor}
                disabled={finished}
                onDone={reloadAll}
              />
            </div>

            <Panel className="p-4">
              <h3 className="font-display mb-3 text-lg font-bold uppercase tracking-wide">Recorded so far</h3>
              {events.loading ? (
                <LoadingBlock rows={3} height={32} />
              ) : (events.data?.events ?? []).length === 0 ? (
                <EmptyState title="Nothing recorded yet" />
              ) : (
                <ul className="space-y-2">
                  {events.data!.events!.map((e, i) => {
                    const ownGoal = isOwnGoalEvent(e, homeSquad.data ?? [], awaySquad.data ?? []);
                    return (
                      <li key={i} className="flex items-center gap-2 rounded-lg bg-panel-2/60 px-3 py-2 text-sm">
                        {e.event_type === "goal" && <IconBallFootball size={16} className="text-pitch" />}
                        {e.event_type === "yellow_card" && <IconSquareFilled size={12} className="text-yellow-400" />}
                        {e.event_type === "red_card" && <IconSquareFilled size={12} className="text-red-500" />}
                        {e.event_type === "penalty_save" && <IconHandStop size={16} className="text-sky-400" />}
                        <span className="min-w-0 flex-1 truncate">
                          {e.player_name || "Unassigned"}
                          {e.assist_player_name ? ` (assist ${e.assist_player_name})` : ""}
                        </span>
                        {ownGoal && (
                          <Badge size="xs" variant="filled" color="orange">
                            OG
                          </Badge>
                        )}
                        <span className="shrink-0 text-xs text-muted">{e.team_name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-xs text-muted">
                <span>{(cards.data ?? []).length} cards</span>
                <span>{(saves.data ?? []).length} penalty saves</span>
              </div>
            </Panel>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="result">
          <ResultForm match={m} onDone={reloadAll} />
        </Tabs.Panel>

        <Tabs.Panel value="lineups">
          {!m.game_week_id ? (
            <EmptyState title="This match has no game week">
              Lineups are stored per game week — assign one from the Matches tab first.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {[
                { teamId: m.team1_id, name: m.team1?.name ?? "Home", squad: homeSquad.data ?? [] },
                { teamId: m.team2_id, name: m.team2?.name ?? "Away", squad: awaySquad.data ?? [] },
              ].map((side) => (
                <LineupEditor
                  key={side.teamId}
                  matchId={m.id}
                  gameWeekId={m.game_week_id!}
                  teamId={side.teamId}
                  teamName={side.name}
                  squad={side.squad}
                  otherSquad={side.teamId === m.team1_id ? (awaySquad.data ?? []) : (homeSquad.data ?? [])}
                  current={(lineup.data ?? []).filter((p) => p.team_id === side.teamId)}
                  disabled={finished}
                  onChanged={lineup.reload}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </AdminLayout>
  );
}

/* ---------------- goals ---------------- */

type GoalMode = "team" | "own" | "none";

const GOAL_MODES: { value: GoalMode; label: string }[] = [
  { value: "team", label: "Team goal" },
  { value: "own", label: "Own goal" },
  { value: "none", label: "No scorer" },
];

function GoalForm({
  match,
  teamOptions,
  squadFor,
  otherTeamId,
  disabled,
  onDone,
}: {
  match: Match;
  teamOptions: TeamOption[];
  squadFor: (teamId: string | null) => TeamPlayer[];
  otherTeamId: (teamId: string | null) => string | null;
  disabled: boolean;
  onDone: () => void;
}) {
  const [team, setTeam] = useState<string>(teamOptions[0].value);
  const [mode, setMode] = useState<GoalMode>("team");
  const [scorer, setScorer] = useState<string | null>(null);
  const [assist, setAssist] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // "Own goal" is scored by a player on the OTHER side of this match, not the team that benefits.
  const scorerSquad = mode === "own" ? squadFor(otherTeamId(team)) : squadFor(team);
  const assistSquad = squadFor(team).filter((p) => p.id !== scorer);

  const resetPickers = () => {
    setScorer(null);
    setAssist(null);
  };

  const submit = async () => {
    if (!team) return;
    setBusy(true);
    const done = await runAction(
      () =>
        submitGoal(match.id, {
          team_id: team,
          player_id: mode === "none" ? null : scorer,
          assist_player_id: mode === "team" ? assist : null,
        }),
      { success: mode === "own" ? "Own goal recorded" : "Goal recorded" }
    );
    setBusy(false);
    if (done) {
      resetPickers();
      onDone();
    }
  };

  const canSubmit = !!team && (mode === "none" || !!scorer);

  return (
    <Panel className="p-4">
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide">
        <IconBallFootball size={18} className="text-pitch" /> Add goal
      </h3>
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs font-medium text-muted">Goes on the scoreboard for</div>
          <SegmentedControl
            fullWidth
            size="xs"
            color="green"
            data={teamOptions}
            value={team}
            onChange={(v) => {
              setTeam(v);
              resetPickers();
            }}
          />
        </div>

        <SegmentedControl
          fullWidth
          size="xs"
          data={GOAL_MODES}
          value={mode}
          onChange={(v) => {
            setMode(v as GoalMode);
            resetPickers();
          }}
        />

        {mode !== "none" && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted">
              {mode === "own" ? "Who put it in their own net?" : "Scorer"}
            </div>
            <PlayerChips
              players={scorerSquad}
              value={scorer}
              onChange={setScorer}
              color={mode === "own" ? "orange" : "green"}
              emptyMessage={mode === "own" ? "The other team has no squad set up" : "No players in this squad"}
            />
          </div>
        )}

        {mode === "team" && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted">Assist (optional)</div>
            <PlayerChips players={assistSquad} value={assist} onChange={setAssist} />
          </div>
        )}

        {mode === "own" && (
          <p className="text-xs text-muted">
            Counts on the scoreboard for {teamOptions.find((t) => t.value === team)?.label}. No assist and no goal
            credit for the scorer — only the score changes.
          </p>
        )}

        <Button fullWidth loading={busy} disabled={disabled || !canSubmit} onClick={submit}>
          Record goal
        </Button>
      </div>
    </Panel>
  );
}

/* ---------------- cards ---------------- */

function CardForm({
  match,
  teamOptions,
  squadFor,
  disabled,
  onDone,
}: {
  match: Match;
  teamOptions: TeamOption[];
  squadFor: (teamId: string | null) => TeamPlayer[];
  disabled: boolean;
  onDone: () => void;
}) {
  const [team, setTeam] = useState<string>(teamOptions[0].value);
  const [player, setPlayer] = useState<string | null>(null);
  const [minute, setMinute] = useState<number>(1);
  const [red, setRed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!team || !player) return;
    setBusy(true);
    const done = await runAction(
      () =>
        submitCard(match.id, {
          team_id: team,
          player_id: player,
          minute,
          is_yellow: !red,
          is_red: red,
        }),
      { success: red ? "Red card recorded" : "Yellow card recorded" }
    );
    setBusy(false);
    if (done) {
      setPlayer(null);
      onDone();
    }
  };

  return (
    <Panel className="p-4">
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide">
        <IconSquareFilled size={14} className={red ? "text-red-500" : "text-yellow-400"} /> Add card
      </h3>
      <div className="space-y-3">
        <SegmentedControl
          fullWidth
          size="xs"
          color={red ? "red" : "yellow"}
          data={teamOptions}
          value={team}
          onChange={(v) => {
            setTeam(v);
            setPlayer(null);
          }}
        />
        <PlayerChips players={squadFor(team)} value={player} onChange={setPlayer} color={red ? "red" : "yellow"} />
        <div className="grid grid-cols-2 items-end gap-3">
          <NumberInput label="Minute" min={0} max={200} value={minute} onChange={(v) => setMinute(Number(v) || 0)} />
          <Checkbox label="Red card" checked={red} onChange={(e) => setRed(e.currentTarget.checked)} />
        </div>
        <Button
          fullWidth
          color={red ? "red" : "yellow"}
          loading={busy}
          disabled={disabled || !team || !player}
          onClick={submit}
        >
          Record card
        </Button>
      </div>
    </Panel>
  );
}

/* ---------------- penalty saves ---------------- */

function PenaltySaveForm({
  match,
  teamOptions,
  squadFor,
  disabled,
  onDone,
}: {
  match: Match;
  teamOptions: TeamOption[];
  squadFor: (teamId: string | null) => TeamPlayer[];
  disabled: boolean;
  onDone: () => void;
}) {
  const [team, setTeam] = useState<string>(teamOptions[0].value);
  const [player, setPlayer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!team || !player) return;
    setBusy(true);
    const done = await runAction(() => submitPenaltySave(match.id, { team_id: team, player_id: player }), {
      success: "Penalty save recorded",
    });
    setBusy(false);
    if (done) {
      setPlayer(null);
      onDone();
    }
  };

  return (
    <Panel className="p-4">
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide">
        <IconHandStop size={18} className="text-sky-400" /> Penalty save
      </h3>
      <div className="space-y-3">
        <SegmentedControl
          fullWidth
          size="xs"
          color="blue"
          data={teamOptions}
          value={team}
          onChange={(v) => {
            setTeam(v);
            setPlayer(null);
          }}
        />
        <PlayerChips players={squadFor(team)} value={player} onChange={setPlayer} color="blue" />
        <Button fullWidth color="blue" loading={busy} disabled={disabled || !team || !player} onClick={submit}>
          Record save
        </Button>
      </div>
    </Panel>
  );
}

/* ---------------- result ---------------- */

function ResultForm({ match, onDone }: { match: Match; onDone: () => void }) {
  const [home, setHome] = useState(match.team1_score);
  const [away, setAway] = useState(match.team2_score);
  const [homeLoans, setHomeLoans] = useState(match.team1_loan_count);
  const [awayLoans, setAwayLoans] = useState(match.team2_loan_count);
  const [date, setDate] = useState<Date | null>(match.match_date ? new Date(match.match_date) : null);
  const [busy, setBusy] = useState(false);

  const saveResult = async () => {
    setBusy(true);
    const done = await runAction(
      () =>
        submitResult(match.id, {
          team1_score: home,
          team2_score: away,
          team1_loan_count: homeLoans,
          team2_loan_count: awayLoans,
          match_date: date ? dayjs(date).toISOString() : null,
        }),
      { success: "Result saved" }
    );
    setBusy(false);
    if (done) onDone();
  };

  const saveLoans = async () => {
    setBusy(true);
    const done = await runAction(() => updateLoanCount(match.id, homeLoans, awayLoans), {
      success: "Loan counts updated",
    });
    setBusy(false);
    if (done) onDone();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel className="p-4">
        <h3 className="font-display mb-3 text-lg font-bold uppercase tracking-wide">Score & kick-off</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label={match.team1?.name ?? "Home"} min={0} value={home} onChange={(v) => setHome(Number(v) || 0)} />
          <NumberInput label={match.team2?.name ?? "Away"} min={0} value={away} onChange={(v) => setAway(Number(v) || 0)} />
        </div>
        <DateTimePicker
          label="Kick-off"
          className="mt-3"
          value={date}
          onChange={(v) => setDate(v ? new Date(v) : null)}
          clearable
        />
        <Button fullWidth className="mt-4" loading={busy} onClick={saveResult}>
          Save result
        </Button>
        <p className="mt-2 text-xs text-muted">
          Saving the score does not complete the match — set the status to <strong>completed</strong> to apply it to the
          table and player points.
        </p>
      </Panel>

      <Panel className="p-4">
        <h3 className="font-display mb-3 text-lg font-bold uppercase tracking-wide">Loan players</h3>
        <p className="mb-3 text-xs text-muted">
          How many borrowed players each side used. This feeds the points adjustment when the match completes.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={match.team1?.name ?? "Home"}
            min={0}
            value={homeLoans}
            onChange={(v) => setHomeLoans(Number(v) || 0)}
          />
          <NumberInput
            label={match.team2?.name ?? "Away"}
            min={0}
            value={awayLoans}
            onChange={(v) => setAwayLoans(Number(v) || 0)}
          />
        </div>
        <Button fullWidth variant="light" className="mt-4" loading={busy} onClick={saveLoans}>
          Update loan counts
        </Button>
      </Panel>
    </div>
  );
}

/* ---------------- lineups ---------------- */

function LineupEditor({
  matchId,
  gameWeekId,
  teamId,
  teamName,
  squad,
  otherSquad,
  current,
  disabled,
  onChanged,
}: {
  matchId: string;
  gameWeekId: string;
  teamId: string;
  teamName: string;
  squad: TeamPlayer[];
  otherSquad: TeamPlayer[];
  current: { player_id: string; name: string; position: string; is_loan: boolean; loan_from_name?: string }[];
  disabled: boolean;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoan, setIsLoan] = useState(false);
  const [busy, setBusy] = useState(false);

  const inLineup = useMemo(() => new Set(current.map((p) => p.player_id)), [current]);
  const pool = (isLoan ? otherSquad : squad).filter((p) => !inLineup.has(p.id));
  const poolOptions = pool.map((p) => ({ value: p.id, label: p.name }));

  const addSelected = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    const done = await runAction(
      () =>
        addLineupPlayers(
          gameWeekId,
          matchId,
          teamId,
          selected.map((player_id) => ({ player_id, is_loan: isLoan }))
        ),
      { success: `${selected.length} player${selected.length > 1 ? "s" : ""} added to lineup` }
    );
    setBusy(false);
    if (done) {
      setSelected([]);
      onChanged();
    }
  };

  const remove = async (playerId: string) => {
    if (await runAction(() => removeLineupPlayer(gameWeekId, matchId, teamId, playerId), { success: "Removed" })) {
      onChanged();
    }
  };

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <TeamCrest name={teamName} size={26} />
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">{teamName}</h3>
        <Badge size="sm" variant="light" color="gray" ml="auto">
          {current.length} picked
        </Badge>
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-muted">No players picked yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {current.map((p) => (
            <li key={p.player_id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <PositionBadge position={p.position} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.is_loan && (
                <Badge size="xs" variant="outline" color="yellow" title={p.loan_from_name}>
                  Loan
                </Badge>
              )}
              <ActionIcon size="sm" variant="subtle" color="red" disabled={disabled} onClick={() => remove(p.player_id)}>
                <IconTrash size={14} />
              </ActionIcon>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            size="xs"
            label="Borrowed from the other team"
            checked={isLoan}
            onChange={(e) => {
              setIsLoan(e.currentTarget.checked);
              setSelected([]);
            }}
          />
          {poolOptions.length > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-pitch hover:underline disabled:opacity-40"
              disabled={disabled}
              onClick={() => setSelected(poolOptions.map((o) => o.value))}
            >
              Select all ({poolOptions.length})
            </button>
          )}
        </div>
        <MultiSelect
          placeholder={poolOptions.length === 0 ? "Nobody left to add" : "Pick one or more players"}
          data={poolOptions}
          value={selected}
          onChange={setSelected}
          searchable
          disabled={disabled || poolOptions.length === 0}
          nothingFoundMessage="No players match"
        />
        <Button fullWidth size="xs" loading={busy} disabled={disabled || selected.length === 0} onClick={addSelected}>
          Add {selected.length > 0 ? `${selected.length} player${selected.length > 1 ? "s" : ""}` : "to lineup"}
        </Button>
      </div>
    </Panel>
  );
}
