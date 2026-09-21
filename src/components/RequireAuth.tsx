import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, type ReactNode } from "react";
import { LoadingBlock } from "./States";

/** Redirects to /login (remembering where the user was heading) when signed out. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace({ pathname: "/login", query: { next: router.asPath } });
    }
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingBlock rows={3} height={96} />;
  return <>{children}</>;
}
