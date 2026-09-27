import AdminLayout from "@/components/admin/AdminLayout";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import { createUser, deleteUser, getUsers, updateUser } from "@/services/api";
import type { CreateUserInput, User } from "@/types";
import { runAction } from "@/utils/actions";
import { formatDate } from "@/utils/helpers";
import { ActionIcon, Badge, Button, Modal, PasswordInput, Select, Table, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPencil, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

const ROLES = ["player", "admin"];
const POSITIONS = ["goalkeeper", "defender", "midfielder", "striker"];

const emptyUser: CreateUserInput = { name: "", email: "", password: "", role: "player", position: "midfielder" };

export default function AdminUsersPage() {
  const users = useApi(getUsers);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User>();

  const q = query.trim().toLowerCase();
  const rows = (users.data ?? [])
    .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  const confirmDelete = (u: User) =>
    modals.openConfirmModal({
      title: `Delete ${u.name}?`,
      children: <p className="text-sm text-muted">They lose access immediately. This cannot be undone.</p>,
      labels: { confirm: "Delete user", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (await runAction(() => deleteUser(u.id), { success: "User deleted" })) users.reload();
      },
    });

  return (
    <AdminLayout
      title="Users"
      subtitle="Accounts that can sign in. Creating a player here also creates their player profile."
      right={
        <div className="flex items-end gap-2">
          <TextInput
            label="Search"
            size="sm"
            w={200}
            leftSection={<IconSearch size={14} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Name or email"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            New user
          </Button>
        </div>
      }
    >
      {users.loading ? (
        <LoadingBlock rows={5} height={40} />
      ) : users.error ? (
        <ErrorState message={users.error} onRetry={users.reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <Table miw={620} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Joined</Table.Th>
                <Table.Th w={100} ta="right">
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td className="font-medium">{u.name}</Table.Td>
                  <Table.Td className="text-sm text-muted">{u.email}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color={u.role === "admin" ? "green" : "gray"}>
                      {u.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="text-sm text-muted">{formatDate(u.created_at)}</Table.Td>
                  <Table.Td ta="right">
                    <ActionIcon variant="subtle" color="gray" onClick={() => setEditing(u)} title="Edit">
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(u)} title="Delete">
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <CreateUserModal opened={creating} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); users.reload(); }} />
      <EditUserModal user={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); users.reload(); }} />
    </AdminLayout>
  );
}

function CreateUserModal({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateUserInput>(emptyUser);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const done = await runAction(() => createUser(form), { success: "User created" });
    setBusy(false);
    if (done) {
      setForm(emptyUser);
      onCreated();
    }
  };

  const valid = form.name.trim() && form.email.trim() && form.password.length >= 6;

  return (
    <Modal opened={opened} onClose={onClose} title="New user" centered>
      <div className="space-y-3">
        <TextInput
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
        />
        <TextInput
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
        />
        <PasswordInput
          label="Password"
          required
          description="At least 6 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.currentTarget.value })}
        />
        <Select
          label="Role"
          data={ROLES}
          value={form.role}
          allowDeselect={false}
          onChange={(v) => v && setForm({ ...form, role: v })}
        />
        {form.role === "player" && (
          <Select
            label="Position"
            data={POSITIONS}
            value={form.position ?? null}
            allowDeselect={false}
            onChange={(v) => v && setForm({ ...form, position: v })}
          />
        )}
        <Button fullWidth loading={busy} disabled={!valid} onClick={submit}>
          Create user
        </Button>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user?: User; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<User>>({});
  const [key, setKey] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (user && key !== user.id) {
    setKey(user.id);
    setForm({ name: user.name, email: user.email, role: user.role });
  }

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const done = await runAction(() => updateUser(user.id, form), { success: "User updated" });
    setBusy(false);
    if (done) onSaved();
  };

  return (
    <Modal opened={!!user} onClose={onClose} title="Edit user" centered>
      <div className="space-y-3">
        <TextInput
          label="Name"
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
        />
        <TextInput
          label="Email"
          value={form.email ?? ""}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
        />
        <Select
          label="Role"
          data={ROLES}
          value={form.role ?? null}
          allowDeselect={false}
          onChange={(v) => v && setForm({ ...form, role: v })}
        />
        <Button fullWidth loading={busy} onClick={submit}>
          Save changes
        </Button>
      </div>
    </Modal>
  );
}
