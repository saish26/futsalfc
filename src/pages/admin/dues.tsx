import AdminLayout from "@/components/admin/AdminLayout";
import StatTile from "@/components/StatTile";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import { getAllDues, getPlayers, payDues, setDues } from "@/services/api";
import type { PlayerDueRow } from "@/types";
import { runAction } from "@/utils/actions";
import { Button, Modal, NumberInput, Table, TextInput } from "@mantine/core";
import { IconCash, IconCoin, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

export default function AdminDuesPage() {
  const dues = useApi(getAllDues);
  const players = useApi(getPlayers);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ mode: "set" | "pay"; row: PlayerDueRow }>();

  // Players with no dues row yet still need one, so merge both lists.
  const rows = useMemo(() => {
    const byId = new Map<string, PlayerDueRow>();
    for (const p of players.data ?? []) {
      if (!byId.has(p.id)) byId.set(p.id, { player_id: p.id, player_name: p.name, remaining: 0 });
    }
    for (const d of dues.data ?? []) byId.set(d.player_id, d);
    const q = query.trim().toLowerCase();
    return [...byId.values()]
      .filter((d) => !q || d.player_name?.toLowerCase().includes(q))
      .sort((a, b) => b.remaining - a.remaining || (a.player_name ?? "").localeCompare(b.player_name ?? ""));
  }, [dues.data, players.data, query]);

  const owing = rows.filter((r) => r.remaining > 0);
  const total = owing.reduce((s, r) => s + r.remaining, 0);

  return (
    <AdminLayout
      title="Dues"
      subtitle="Set what each player owes and record payments."
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
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Players owing" value={owing.length} />
        <StatTile label="Total outstanding" value={`Rs ${total.toLocaleString()}`} />
        <StatTile label="Settled" value={rows.length - owing.length} />
      </div>

      {dues.loading || players.loading ? (
        <LoadingBlock rows={5} height={40} />
      ) : dues.error ? (
        <ErrorState message={dues.error} onRetry={dues.reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No players yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <Table miw={520} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Player</Table.Th>
                <Table.Th ta="right">Remaining</Table.Th>
                <Table.Th w={210} ta="right">
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((d) => (
                <Table.Tr key={d.player_id}>
                  <Table.Td className="font-medium">{d.player_name}</Table.Td>
                  <Table.Td ta="right">
                    <span className={`tabular font-semibold ${d.remaining > 0 ? "text-yellow-400" : "text-muted"}`}>
                      Rs {d.remaining.toLocaleString()}
                    </span>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconCoin size={14} />}
                      onClick={() => setModal({ mode: "set", row: d })}
                    >
                      Set
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      ml={6}
                      leftSection={<IconCash size={14} />}
                      disabled={d.remaining <= 0}
                      onClick={() => setModal({ mode: "pay", row: d })}
                    >
                      Payment
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <AmountModal
        state={modal}
        onClose={() => setModal(undefined)}
        onDone={() => {
          setModal(undefined);
          dues.reload();
        }}
      />
    </AdminLayout>
  );
}

function AmountModal({
  state,
  onClose,
  onDone,
}: {
  state?: { mode: "set" | "pay"; row: PlayerDueRow };
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [key, setKey] = useState<string>();
  const [busy, setBusy] = useState(false);

  const stateKey = state ? `${state.mode}-${state.row.player_id}` : undefined;
  if (state && key !== stateKey) {
    setKey(stateKey);
    setAmount(state.mode === "set" ? state.row.remaining : 0);
  }

  const submit = async () => {
    if (!state || amount <= 0) return;
    setBusy(true);
    const done =
      state.mode === "set"
        ? await runAction(() => setDues(state.row.player_id, amount), { success: "Dues updated" })
        : await runAction(() => payDues(state.row.player_id, amount), { success: "Payment recorded" });
    setBusy(false);
    if (done) onDone();
  };

  return (
    <Modal
      opened={!!state}
      onClose={onClose}
      centered
      title={state?.mode === "set" ? `Set dues for ${state?.row.player_name}` : `Record payment — ${state?.row.player_name}`}
    >
      <NumberInput
        label={state?.mode === "set" ? "Amount owed (Rs)" : "Amount paid (Rs)"}
        min={1}
        value={amount}
        onChange={(v) => setAmount(Number(v) || 0)}
        thousandSeparator=","
      />
      {state?.mode === "pay" && (
        <p className="mt-2 text-xs text-muted">
          Currently outstanding: Rs {state.row.remaining.toLocaleString()}
        </p>
      )}
      <Button fullWidth className="mt-4" loading={busy} disabled={amount <= 0} onClick={submit}>
        {state?.mode === "set" ? "Save amount" : "Record payment"}
      </Button>
    </Modal>
  );
}
