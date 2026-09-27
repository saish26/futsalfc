import AdminLayout from "@/components/admin/AdminLayout";
import { Panel } from "@/components/Section";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import {
  createLeague,
  deleteLeague,
  generateFixtures,
  getLeagueGameWeeks,
  updateGameWeekStatus,
  updateLeague,
  updateLeagueStatus,
} from "@/services/api";
import type { League, LeagueInput } from "@/types";
import { formatDate } from "@/utils/helpers";
import { runAction } from "@/utils/actions";
import { ActionIcon, Button, Collapse, Menu, Modal, NumberInput, Select, Table, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { IconChevronDown, IconDots, IconPencil, IconPlus, IconTrash, IconWand } from "@tabler/icons-react";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";

const LEAGUE_STATUSES = ["upcoming", "active", "completed"];
const WEEK_STATUSES = ["upcoming", "ongoing", "completed"];

const emptyForm: LeagueInput = {
  name: "",
  start_date: dayjs().toISOString(),
  end_date: dayjs().add(3, "month").toISOString(),
  status: "upcoming",
  game_weeks: 5,
};

export default function AdminLeaguesPage() {
  const leagues = useApi<League[]>(() => import("@/services/api").then((m) => m.getLeagues()));
  const [editing, setEditing] = useState<League | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string>();
  const [busy, setBusy] = useState(false);

  const save = async (input: LeagueInput) => {
    setBusy(true);
    const done = editing
      ? await runAction(() => updateLeague(editing.id, input), { success: "League updated" })
      : await runAction(() => createLeague(input), { success: "League created" });
    setBusy(false);
    if (done) {
      setCreating(false);
      setEditing(null);
      leagues.reload();
    }
  };

  const changeStatus = async (l: League, status: string) => {
    if (await runAction(() => updateLeagueStatus(l.id, status), { success: `${l.name} is now ${status}` })) {
      leagues.reload();
    }
  };

  const confirmDelete = (l: League) =>
    modals.openConfirmModal({
      title: `Delete ${l.name}?`,
      children: <p className="text-sm text-muted">This removes the league permanently. This cannot be undone.</p>,
      labels: { confirm: "Delete league", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deleteLeague(l.id), { success: "League deleted" })) leagues.reload();
      },
    });

  const confirmFixtures = (l: League) =>
    modals.openConfirmModal({
      title: `Generate fixtures for ${l.name}?`,
      children: (
        <p className="text-sm text-muted">
          Creates matches for all {l.game_weeks} game weeks from the teams in this league. The API refuses if fixtures
          already exist.
        </p>
      ),
      labels: { confirm: "Generate", cancel: "Cancel" },
      onConfirm: async () => {
        if (await runAction(() => generateFixtures(l.id), { success: "Fixtures generated" })) leagues.reload();
      },
    });

  return (
    <AdminLayout
      title="Leagues"
      subtitle="Create seasons, set their status and generate fixtures."
      right={
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
          New league
        </Button>
      }
    >
      {leagues.loading ? (
        <LoadingBlock rows={4} height={48} />
      ) : leagues.error ? (
        <ErrorState message={leagues.error} onRetry={leagues.reload} />
      ) : (leagues.data ?? []).length === 0 ? (
        <EmptyState title="No leagues yet">Create one to get started.</EmptyState>
      ) : (
        <div className="space-y-3">
          {leagues.data!.map((l) => (
            <Panel key={l.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setExpanded(expanded === l.id ? undefined : l.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <IconChevronDown
                    size={16}
                    className={`shrink-0 text-muted transition-transform ${expanded === l.id ? "rotate-180" : ""}`}
                  />
                  <span className="min-w-0">
                    <span className="font-display block truncate text-xl font-bold uppercase tracking-wide">
                      {l.name}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDate(l.start_date)} – {formatDate(l.end_date)} · {l.game_weeks} game weeks
                    </span>
                  </span>
                </button>

                <Select
                  size="xs"
                  w={130}
                  value={l.status}
                  data={LEAGUE_STATUSES}
                  allowDeselect={false}
                  onChange={(v) => v && changeStatus(l, v)}
                />

                <Menu position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDots size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconPencil size={15} />} onClick={() => setEditing(l)}>
                      Edit details
                    </Menu.Item>
                    <Menu.Item leftSection={<IconWand size={15} />} onClick={() => confirmFixtures(l)}>
                      Generate fixtures
                    </Menu.Item>
                    <Menu.Item component={Link} href={`/leagues/${l.id}`}>
                      View public page
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconTrash size={15} />} onClick={() => confirmDelete(l)}>
                      Delete league
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>

              <Collapse expanded={expanded === l.id} keepMounted={false}>
                <GameWeeks leagueId={l.id} />
              </Collapse>
            </Panel>
          ))}
        </div>
      )}

      <LeagueForm
        opened={creating || !!editing}
        league={editing}
        busy={busy}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
    </AdminLayout>
  );
}

function GameWeeks({ leagueId }: { leagueId: string }) {
  const weeks = useApi(() => getLeagueGameWeeks(leagueId), [leagueId]);

  const change = async (id: string, status: string) => {
    if (await runAction(() => updateGameWeekStatus(id, status), { success: "Game week updated" })) weeks.reload();
  };

  if (weeks.loading) return <LoadingBlock rows={2} height={32} />;
  if ((weeks.data ?? []).length === 0)
    return <p className="mt-4 text-sm text-muted">No game weeks yet — generate fixtures to create them.</p>;

  return (
    <div className="mt-4 overflow-x-auto border-t border-line pt-4">
      <Table className="tabular" miw={420} verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Week</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="right">Matches</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {weeks.data!.map((w) => (
            <Table.Tr key={w.id}>
              <Table.Td>
                <span className="font-semibold">Game week {w.week_number}</span>
              </Table.Td>
              <Table.Td>
                <div className="flex items-center gap-2">
                  <StatusBadge status={w.status} size="xs" />
                  <Select
                    size="xs"
                    w={120}
                    value={w.status}
                    data={WEEK_STATUSES}
                    allowDeselect={false}
                    onChange={(v) => v && change(w.id, v)}
                  />
                </div>
              </Table.Td>
              <Table.Td ta="right">
                <Link href={`/gameweeks/${w.id}`} className="text-sm text-pitch hover:underline">
                  View →
                </Link>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

function LeagueForm({
  opened,
  league,
  busy,
  onClose,
  onSubmit,
}: {
  opened: boolean;
  league: League | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: LeagueInput) => void;
}) {
  const [form, setForm] = useState<LeagueInput>(emptyForm);
  const [key, setKey] = useState("");

  // Reset the fields whenever a different league (or "new") opens the modal.
  const formKey = league?.id ?? "new";
  if (opened && key !== formKey) {
    setKey(formKey);
    setForm(
      league
        ? {
            name: league.name,
            start_date: league.start_date,
            end_date: league.end_date,
            status: league.status,
            game_weeks: league.game_weeks,
          }
        : emptyForm
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={league ? "Edit league" : "New league"} centered>
      <div className="space-y-3">
        <TextInput
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          placeholder="Winter League 2026"
        />
        <div className="grid grid-cols-2 gap-3">
          <DateInput
            label="Start date"
            value={form.start_date ? new Date(form.start_date) : null}
            onChange={(d) => setForm({ ...form, start_date: d ? dayjs(d).toISOString() : "" })}
          />
          <DateInput
            label="End date"
            value={form.end_date ? new Date(form.end_date) : null}
            onChange={(d) => setForm({ ...form, end_date: d ? dayjs(d).toISOString() : "" })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Game weeks"
            min={1}
            max={40}
            value={form.game_weeks}
            onChange={(v) => setForm({ ...form, game_weeks: Number(v) || 0 })}
          />
          <Select
            label="Status"
            data={LEAGUE_STATUSES}
            value={form.status}
            allowDeselect={false}
            onChange={(v) => v && setForm({ ...form, status: v })}
          />
        </div>
        <Button fullWidth loading={busy} disabled={!form.name.trim()} onClick={() => onSubmit(form)}>
          {league ? "Save changes" : "Create league"}
        </Button>
      </div>
    </Modal>
  );
}
