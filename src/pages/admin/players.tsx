import AdminLayout from "@/components/admin/AdminLayout";
import PositionBadge from "@/components/PositionBadge";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import {
  deletePlayer,
  deletePlayerStats,
  getAllPlayerStats,
  getLeagues,
  getPlayers,
  getTeams,
  getUnassignedPlayers,
  createProfileForUser,
  getUsers,
  updatePlayer,
  updatePlayerStats,
} from "@/services/api";
import type { PlayerStatsInput, PlayerStatsWithNames } from "@/types";
import { runAction } from "@/utils/actions";
import { ActionIcon, Alert, Badge, Button, Modal, NumberInput, SegmentedControl, Select, Table, TextInput, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconAlertCircle, IconChartBar, IconSearch, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const POSITIONS = ["goalkeeper", "defender", "midfielder", "striker"];

interface Row {
  id: string;
  name: string;
  position: string;
  teamIds: string[];
  /** false when the account exists but the player never finished onboarding (no player row) */
  hasProfile: boolean;
}

const needsPosition = (r: Row) => !r.hasProfile || !POSITIONS.includes((r.position || "").toLowerCase());

export default function AdminPlayersPage() {
  const players = useApi(getPlayers);
  const unassigned = useApi(getUnassignedPlayers);
  const teams = useApi(getTeams);
  const stats = useApi(getAllPlayerStats);
  const leagues = useApi(getLeagues);
  const users = useApi(getUsers);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [statsFor, setStatsFor] = useState<Row>();

  const teamName = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t.name])), [teams.data]);

  const allRows = useMemo(() => {
    const merged = new Map<string, Row>();
    for (const p of players.data ?? []) {
      const existing = merged.get(p.id);
      if (existing) existing.teamIds.push(p.team_id);
      else merged.set(p.id, { id: p.id, name: p.name, position: p.position, teamIds: [p.team_id], hasProfile: true });
    }
    for (const p of unassigned.data ?? []) {
      if (!merged.has(p.id))
        merged.set(p.id, { id: p.id, name: p.name, position: p.position, teamIds: [], hasProfile: true });
    }

    // Player accounts with no player row yet: they signed in but never picked a position.
    const named = new Set([...merged.values()].map((r) => r.name.trim().toLowerCase()));
    for (const u of users.data ?? []) {
      if (u.role !== "player") continue;
      if (named.has((u.name ?? "").trim().toLowerCase())) continue;
      merged.set(`user-${u.id}`, { id: u.id, name: u.name, position: "", teamIds: [], hasProfile: false });
    }

    return [...merged.values()];
  }, [players.data, unassigned.data, users.data]);

  const missing = allRows.filter(needsPosition);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows
      .filter((p) => (filter === "missing" ? needsPosition(p) : filter === "free" ? p.teamIds.length === 0 : true))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => Number(needsPosition(b)) - Number(needsPosition(a)) || a.name.localeCompare(b.name));
  }, [allRows, query, filter]);

  const changePosition = async (row: Row, position: string) => {
    // No player row yet? Create the profile for that user id. Otherwise update the existing row —
    // the API binds onto the stored record, so sending just the position keeps their stats intact.
    const done = row.hasProfile
      ? await runAction(() => updatePlayer(row.id, { id: row.id, position }), { success: `${row.name} updated` })
      : await runAction(() => createProfileForUser(row.id, position), {
          success: `${row.name} is now a ${position}`,
        });

    if (done) {
      players.reload();
      unassigned.reload();
      users.reload();
    }
  };

  const confirmDelete = (row: Row) =>
    modals.openConfirmModal({
      title: `Delete ${row.name}?`,
      children: (
        <p className="text-sm text-muted">
          The player profile is removed. Their user account stays — delete that from the Users tab if you want it gone
          too.
        </p>
      ),
      labels: { confirm: "Delete player", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deletePlayer(row.id), { success: "Player deleted" })) {
          players.reload();
          unassigned.reload();
        }
      },
    });

  return (
    <AdminLayout
      title="Players"
      subtitle="Positions, stat corrections and removals."
      right={
        <TextInput
          label="Search"
          size="sm"
          w={220}
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Player name"
        />
      }
    >
      {missing.length > 0 && (
        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />} className="mb-4">
          <strong>
            {missing.length} {missing.length === 1 ? "player has" : "players have"} no position yet.
          </strong>{" "}
          Set it from the Position column. Anyone marked <em>no profile</em> signed in but never finished onboarding —
          picking a position for them creates their profile.
        </Alert>
      )}

      <div className="mb-4 overflow-x-auto">
        <SegmentedControl
          size="xs"
          color="green"
          value={filter}
          onChange={setFilter}
          data={[
            { value: "all", label: `All (${allRows.length})` },
            { value: "missing", label: `Needs a position (${missing.length})` },
            { value: "free", label: "Free agents" },
          ]}
        />
      </div>

      {players.loading ? (
        <LoadingBlock rows={5} height={40} />
      ) : players.error ? (
        <ErrorState message={players.error} onRetry={players.reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No players yet">Players appear once they sign in and pick a position.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <Table miw={640} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Player</Table.Th>
                <Table.Th>Teams</Table.Th>
                <Table.Th w={170}>Position</Table.Th>
                <Table.Th w={110} ta="right">
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((p) => (
                <Table.Tr key={p.id} className={needsPosition(p) ? "bg-yellow-500/5" : ""}>
                  <Table.Td>
                    {p.hasProfile ? (
                      <Link href={`/players/${p.id}`} className="flex items-center gap-2 hover:text-pitch">
                        <PositionBadge position={p.position} />
                        <span className="font-medium">{p.name}</span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Tooltip
                          multiline
                          w={260}
                          label="This account signed in but never picked a position. Choosing one here creates their player profile."
                        >
                          <Badge size="xs" variant="light" color="yellow" className="cursor-help">
                            no profile
                          </Badge>
                        </Tooltip>
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-sm text-muted">
                    {p.teamIds.map((id) => teamName.get(id)).filter(Boolean).join(", ") || "Free agent"}
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={POSITIONS}
                      value={POSITIONS.includes(p.position?.toLowerCase()) ? p.position.toLowerCase() : null}
                      placeholder="Set position"
                      error={needsPosition(p)}
                      allowDeselect={false}
                      onChange={(v) => v && v !== p.position?.toLowerCase() && changePosition(p, v)}
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      title="Stat corrections"
                      disabled={!p.hasProfile}
                      onClick={() => setStatsFor(p)}
                    >
                      <IconChartBar size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      title={p.hasProfile ? "Delete player" : "No player profile to delete"}
                      disabled={!p.hasProfile}
                      onClick={() => confirmDelete(p)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <StatsModal
        row={statsFor}
        stats={(stats.data ?? []).filter((s) => s.player_id === statsFor?.id)}
        leagueName={(id: string | null) => (leagues.data ?? []).find((l) => l.id === id)?.name ?? "League"}
        onClose={() => setStatsFor(undefined)}
        onChanged={stats.reload}
      />
    </AdminLayout>
  );
}

const emptyStats: PlayerStatsInput = {
  goals: 0,
  assists: 0,
  clean_sheets: 0,
  penalty_saves: 0,
  penalty_missed: 0,
  goals_conceded: 0,
  yellow_cards: 0,
  red_cards: 0,
};

const FIELDS: { key: keyof PlayerStatsInput; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "clean_sheets", label: "Clean sheets" },
  { key: "penalty_saves", label: "Penalty saves" },
  { key: "penalty_missed", label: "Penalties missed" },
  { key: "goals_conceded", label: "Goals conceded" },
  { key: "yellow_cards", label: "Yellow cards" },
  { key: "red_cards", label: "Red cards" },
];

function StatsModal({
  row,
  stats,
  leagueName,
  onClose,
  onChanged,
}: {
  row?: Row;
  stats: PlayerStatsWithNames[];
  leagueName: (id: string | null) => string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<string>();
  const [form, setForm] = useState<PlayerStatsInput>(emptyStats);
  const [busy, setBusy] = useState(false);

  const startEdit = (s: PlayerStatsWithNames) => {
    setEditing(s.id);
    setForm({
      goals: s.goals,
      assists: s.assists,
      clean_sheets: s.clean_sheets,
      penalty_saves: s.penalty_saves,
      penalty_missed: s.penalty_missed,
      goals_conceded: s.goals_conceded,
      yellow_cards: s.yellow_cards,
      red_cards: s.red_cards,
    });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const done = await runAction(() => updatePlayerStats(editing, form), { success: "Stats updated" });
    setBusy(false);
    if (done) {
      setEditing(undefined);
      onChanged();
    }
  };

  const confirmDelete = (id: string) =>
    modals.openConfirmModal({
      title: "Delete this stats row?",
      children: <p className="text-sm text-muted">The player&apos;s record for that league is removed.</p>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deletePlayerStats(id), { success: "Stats row deleted" })) onChanged();
      },
    });

  return (
    <Modal opened={!!row} onClose={onClose} title={row ? `${row.name} — stat corrections` : ""} centered size="lg">
      {stats.length === 0 ? (
        <p className="text-sm text-muted">No stats rows yet. They are created automatically as matches complete.</p>
      ) : editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <NumberInput
                key={f.key}
                label={f.label}
                min={0}
                value={form[f.key]}
                onChange={(v) => setForm({ ...form, [f.key]: Number(v) || 0 })}
              />
            ))}
          </div>
          <p className="text-xs text-muted">Fantasy points are recalculated by the API from these numbers.</p>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setEditing(undefined)} className="flex-1">
              Cancel
            </Button>
            <Button loading={busy} onClick={save} className="flex-1">
              Save stats
            </Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {stats.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{leagueName(s.league_id)}</div>
                <div className="tabular text-xs text-muted">
                  {s.goals}G · {s.assists}A · {s.clean_sheets}CS · {s.points} pts
                </div>
              </div>
              <Button size="xs" variant="light" onClick={() => startEdit(s)}>
                Edit
              </Button>
              <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(s.id)}>
                <IconTrash size={15} />
              </ActionIcon>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
