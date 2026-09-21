import { useAuth } from "@/context/AuthContext";
import { googleLogin, login as loginRequest } from "@/services/api";
import { Alert, Button, Divider, PasswordInput, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { GoogleLogin } from "@react-oauth/google";
import { IconAlertCircle, IconBallFootball, IconChevronDown } from "@tabler/icons-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXTPUBLIC_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, ready } = useAuth();
  const next = typeof router.query.next === "string" ? router.query.next : "/me";

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Already signed in? Don't show the form again.
  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const onGoogle = async (credential?: string) => {
    if (!credential) return;
    setBusy(true);
    setError(null);
    try {
      const res = await googleLogin(credential);
      signIn(res.token);
      notifications.show({ color: "green", message: "Signed in with Google" });
      router.replace(res.needsOnboarding ? "/onboarding" : next);
    } catch (err) {
      setError(typeof err === "string" ? err : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const onAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await loginRequest(email, password);
      signIn(res.token);
      notifications.show({ color: "green", message: "Signed in" });
      router.replace(next);
    } catch (err) {
      setError(typeof err === "string" ? err : "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign in · FutsalFC</title>
      </Head>

      <div className="mx-auto max-w-md py-6 sm:py-12">
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-pitch text-ink">
              <IconBallFootball size={28} />
            </span>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Sign in</h1>
            <p className="mt-2 text-sm text-muted">
              Players sign in with Google to see their own stats, fixtures and availability.
            </p>
          </div>

          {error && (
            <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />} className="mb-4">
              {error}
            </Alert>
          )}

          <div className="flex justify-center">
            {GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={(res) => onGoogle(res.credential)}
                onError={() => setError("Google sign-in failed")}
                theme="filled_black"
                shape="pill"
                width="320"
                text="continue_with"
              />
            ) : (
              <Alert color="yellow" variant="light" className="w-full">
                Google sign-in isn&apos;t configured yet. Add <code>NEXTPUBLIC_CLIENT_ID</code> to{" "}
                <code>.env.local</code> and the same web client ID to <code>google.client_id</code> in the API&apos;s{" "}
                <code>config.yml</code>.
              </Alert>
            )}
          </div>

          <Divider
            my="lg"
            labelPosition="center"
            label={
              <button
                type="button"
                onClick={() => setShowAdmin((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted hover:text-white"
              >
                Admin sign in
                <IconChevronDown size={14} className={showAdmin ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            }
          />

          {showAdmin && (
            <form onSubmit={onAdminLogin} className="space-y-3">
              <TextInput
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="admin@futsalfc.com"
              />
              <PasswordInput
                label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <Button type="submit" fullWidth loading={busy}>
                Sign in
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Just browsing?{" "}
          <Link href="/" className="text-pitch hover:underline">
            View the league without signing in
          </Link>
        </p>
      </div>
    </>
  );
}
