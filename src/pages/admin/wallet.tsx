import AdminLayout from "@/components/admin/AdminLayout";
import { Panel } from "@/components/Section";
import { ErrorState, LoadingBlock } from "@/components/States";
import { useApi } from "@/hooks/useApi";
import { getWallet, walletAdd, walletDeduct } from "@/services/api";
import { runAction } from "@/utils/actions";
import { Button, NumberInput } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

export default function AdminWalletPage() {
  const wallet = useApi(getWallet);
  const [amount, setAmount] = useState<number>(0);
  const [busy, setBusy] = useState<"add" | "deduct" | null>(null);

  const run = async (mode: "add" | "deduct") => {
    if (amount <= 0) return;
    setBusy(mode);
    const done = await runAction(
      () => (mode === "add" ? walletAdd(amount) : walletDeduct(amount)),
      { success: mode === "add" ? `Rs ${amount.toLocaleString()} added` : `Rs ${amount.toLocaleString()} deducted` }
    );
    setBusy(null);
    if (done) {
      setAmount(0);
      wallet.reload();
    }
  };

  return (
    <AdminLayout title="Wallet" subtitle="The club balance shown on the home page.">
      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="p-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Current balance</div>
          {wallet.loading ? (
            <LoadingBlock rows={1} height={48} />
          ) : wallet.error ? (
            <ErrorState message={wallet.error} onRetry={wallet.reload} />
          ) : (
            <div className="font-display tabular mt-2 text-5xl font-extrabold text-pitch">
              Rs {Number(wallet.data?.amount ?? 0).toLocaleString()}
            </div>
          )}
        </Panel>

        <Panel className="p-6">
          <NumberInput
            label="Amount (Rs)"
            min={1}
            value={amount}
            onChange={(v) => setAmount(Number(v) || 0)}
            thousandSeparator=","
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              leftSection={<IconPlus size={16} />}
              loading={busy === "add"}
              disabled={amount <= 0}
              onClick={() => run("add")}
            >
              Add
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconMinus size={16} />}
              loading={busy === "deduct"}
              disabled={amount <= 0}
              onClick={() => run("deduct")}
            >
              Deduct
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">
            The API rejects a deduction larger than the current balance.
          </p>
        </Panel>
      </div>
    </AdminLayout>
  );
}
