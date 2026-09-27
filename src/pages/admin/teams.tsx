import AdminLayout from "@/components/admin/AdminLayout";
import PositionBadge from "@/components/PositionBadge";
import { Panel } from "@/components/Section";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import TeamCrest from "@/components/TeamCrest";
import { useApi } from "@/hooks/useApi";
import {
  assignPlayerToTeam,
  createTeam,
  deleteTeam,
  getLeagues,
  getTeamPlayers,
  getTeams,
  getUnassignedPlayers,
  removePlayerFromTeam,
  updateTeam,
} from "@/services/api";
import type { Team } from "@/types";
import { runAction } from "@/utils/actions";
import { pickActiveLeague } from "@/utils/helpers";
import { ActionIcon, Button, Modal, Select, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconTrash, IconUserMinus, IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";

export default function AdminTeamsPage() {
  const leagues = useApi(getLeagues);
  const teams = useApi(getTeams);
  const unassigned = useApi(getUnassignedPlayers);

  const [leagueId, setLeagueId] = useState<string>();
  const activeLeague = pickActiveLeague(leagues.data ?? []);
  const selectedLeague = leagueId ?? activeLeague?.id;

  const [form, setForm] = useState<{ open: boolean; team?: Team; name: string }>({ open: false, name: "" });
  const [busy, setBusy] = useState(false);
  const [openRoster, setOpenRoster] = useState<Team>();

  const list = (teams.data ?? []).filter((t) => !selectedLeague || t.league_id === selectedLeague);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    const done = form.team
      ? await runAction(() => updateTeam(form.team!.id, { name: form.name }), { success: "Team updated" })
      : selectedLeague
        ? await runAction(() => createTeam({ name: form.name, league_id: selectedLeague }), { success: "Team created" })
        : undefined;
    setBusy(false);
    if (done) {
      setForm({ open: false, name: "" });
      teams.reload();
    }
  };

  const confirmDelete = (t: Team) =>
    modals.openConfirmModal({
      title: `Delete ${t.name}?`,
      children: <p className="text-sm text-muted">The team and its results are removed. This cannot be undone.</p>,
      labels: { confirm: "Delete team", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deleteTeam(t.id), { success: "Team deleted" })) teams.reload();
      },
    });

  return (
    <AdminLayout
      title="Teams"
      subtitle="Create teams and manage who plays for them."
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
          <Button
            leftSection={<IconPlus size={16} />}
            disabled={!selectedLeague}
            onClick={() => setForm({ open: true, name: "" })}
          >
            New team
          </Button>
        </div>
      }
    >
      {teams.loading ? (
        <LoadingBlock rows={3} height={64} />
      ) : teams.error ? (
        <ErrorState message={teams.error} onRetry={teams.reload} />
      ) : list.length === 0 ? (
        <EmptyState title="No teams in this league">Create one to start building a squad.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((t) => (
            <Panel key={t.id} className="flex items-center gap-3 p-4">
              <TeamCrest name={t.name} size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{t.name}</div>
                <div className="tabular text-xs text-muted">
                  P{t.played} · {t.points} pts
                </div>
              </div>
              <Button size="xs" variant="light" onClick={() => setOpenRoster(t)}>
                Squad
              </Button>
              <ActionIcon variant="subtle" color="gray" onClick={() => setForm({ open: true, team: t, name: t.name })}>
                <IconPlus size={16} className="rotate-45" />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(t)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        opened={form.open}
        onClose={() => setForm({ open: false, name: "" })}
        title={form.team ? "Rename team" : "New team"}
        centered
      >
        <TextInput
          label="Team name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          placeholder="Thamel Tigers"
        />
        <Button fullWidth className="mt-4" loading={busy} disabled={!form.name.trim()} onClick={save}>
          {form.team ? "Save name" : "Create team"}
        </Button>
      </Modal>

      <RosterModal
        team={openRoster}
        unassigned={unassigned.data ?? []}
        onClose={() => setOpenRoster(undefined)}
        onChanged={() => {
          unassigned.reload();
          teams.reload();
        }}
      />
    </AdminLayout>
  );
}

function RosterModal({
  team,
  unassigned,
  onClose,
  onChanged,
}: {
  team?: Team;
  unassigned: { id: string; name: string; position: string }[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const squad = useApi(() => getTeamPlayers(team!.id), [team?.id], !!team);
  const [busyId, setBusyId] = useState<string>();

  const add = async (playerId: string) => {
    if (!team) return;
    setBusyId(playerId);
    if (await runAction(() => assignPlayerToTeam(team.id, playerId), { success: "Player added to team" })) {
      squad.reload();
      onChanged();
    }
    setBusyId(undefined);
  };

  const remove = async (playerId: string) => {
    if (!team) return;
    setBusyId(playerId);
    if (await runAction(() => removePlayerFromTeam(team.id, playerId), { success: "Player removed" })) {
      squad.reload();
      onChanged();
    }
    setBusyId(undefined);
  };

  return (
    <Modal opened={!!team} onClose={onClose} title={team ? `${team.name} squad` : ""} centered size="lg">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">In the squad</h4>
          {squad.loading ? (
            <LoadingBlock rows={3} height={32} />
          ) : (squad.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nobody yet.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {squad.data!.map((p) => (
                <li key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <PositionBadge position={p.position} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    loading={busyId === p.id}
                    onClick={() => remove(p.id)}
                    title="Remove from team"
                  >
                    <IconUserMinus size={15} />
                  </ActionIcon>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Free agents</h4>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted">Every player is on a team.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {unassigned.map((p) => (
                <li key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <PositionBadge position={p.position} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="green"
                    loading={busyId === p.id}
                    onClick={() => add(p.id)}
                    title="Add to team"
                  >
                    <IconUserPlus size={15} />
                  </ActionIcon>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
