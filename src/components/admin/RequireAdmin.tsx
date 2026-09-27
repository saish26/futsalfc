import { EmptyState, LoadingBlock } from "@/components/States";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactNode } from "react";

/** Admin-only wrapper: signed-out users go to /login, players get a plain message. */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace({ pathname: "/login", query: { next: router.asPath } });
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingBlock rows={3} height={96} />;

  if (!isAdmin) {
    return (
      <EmptyState title="Admins only">
        <span className="block">This area is for league admins.</span>
        <Button component={Link} href="/me" variant="light" size="xs" className="mt-3">
          Go to my profile
        </Button>
      </EmptyState>
    );
  }

  return <>{children}</>;
}
