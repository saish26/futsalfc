import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { createProfile } from "@/services/api";
import { Alert, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const POSITIONS = [
  { value: "goalkeeper", label: "Goalkeeper", hint: "Clean sheets and penalty saves score you points" },
  { value: "defender", label: "Defender", hint: "Clean sheets, assists and goals" },
  { value: "midfielder", label: "Midfielder", hint: "Goals and assists score 3 points each" },
  { value: "striker", label: "Striker", hint: "Goals and assists score 3 points each" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, needsOnboarding, refreshProfile } = useAuth();
  const [position, setPosition] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!position) return;
    setBusy(true);
    setError(null);
    try {
      await createProfile(position);
      await refreshProfile();
      notifications.show({ color: "green", message: "Profile created" });
      router.replace("/me");
    } catch (err) {
      setError(typeof err === "string" ? err : "Couldn't create your profile");
    } finally {
      setBusy(false);
    }
  };

  const alreadyDone = !needsOnboarding && !!profile?.player?.position;

  return (
    <RequireAuth>
      <Head>
        <title>Set up your profile · FutsalFC</title>
      </Head>

      <div className="mx-auto max-w-lg py-6 sm:py-10">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-pitch">Welcome{user ? `, ${user.name}` : ""}</div>
          <h1 className="font-display mt-1 text-4xl font-bold uppercase tracking-wide">Pick your position</h1>
          <p className="mt-2 text-sm text-muted">
            Your position decides how your fantasy points are calculated. An admin assigns you to a team afterwards.
          </p>
        </div>

        {error && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />} className="mb-4">
            {error}
          </Alert>
        )}

        {alreadyDone ? (
          <Alert color="green" variant="light" className="mb-4">
            Your profile is already set up as <strong className="capitalize">{profile?.player.position}</strong>.
            <Button variant="subtle" size="compact-sm" onClick={() => router.replace("/me")} className="ml-2">
              Go to my profile
            </Button>
          </Alert>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPosition(p.value)}
                  className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                    position === p.value
                      ? "border-pitch bg-pitch/10"
                      : "border-line bg-panel hover:border-pitch/40 hover:bg-panel-2"
                  }`}
                >
                  <div className="font-display text-xl font-bold uppercase tracking-wide">{p.label}</div>
                  <div className="mt-1 text-xs text-muted">{p.hint}</div>
                </button>
              ))}
            </div>

            <Button fullWidth size="md" className="mt-6" disabled={!position} loading={busy} onClick={submit}>
              Save and continue
            </Button>
          </>
        )}
      </div>
    </RequireAuth>
  );
}
