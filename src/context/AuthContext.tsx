import { getMyProfile } from "@/services/api";
import type { AuthUser, PlayerDetail } from "@/types";
import {
  clearToken,
  getServerTokenSnapshot,
  getTokenSnapshot,
  storeToken,
  subscribeToken,
} from "@/utils/tokenStore";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface AuthState {
  user: AuthUser | null;
  profile: PlayerDetail | null;
  needsOnboarding: boolean;
  /** false until the cookie has been read and any profile fetch has settled */
  ready: boolean;
  isPlayer: boolean;
  isAdmin: boolean;
  signIn: (token: string) => void;
  signOut: (redirectTo?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const decode = (token: string | null): AuthUser | null => {
  if (!token) return null;
  try {
    const claims = jwtDecode<{ user_id: string; name: string; role: string; exp: number }>(token);
    if (claims.exp * 1000 < Date.now()) return null;
    return { id: claims.user_id, name: claims.name, role: claims.role, exp: claims.exp };
  } catch {
    return null;
  }
};

interface ProfileState {
  token: string | null;
  profile: PlayerDetail | null;
  needsOnboarding: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToken, getTokenSnapshot, getServerTokenSnapshot);
  const user = useMemo(() => decode(token), [token]);
  const [state, setState] = useState<ProfileState>({ token: null, profile: null, needsOnboarding: false });

  // Fetch the profile for the current token; setState only happens in async callbacks.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyProfile()
      .then((res) => {
        if (!cancelled) setState({ token, profile: res.profile ?? null, needsOnboarding: !!res.needs_onboarding });
      })
      .catch(() => {
        if (!cancelled) setState({ token, profile: null, needsOnboarding: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  const signIn = useCallback((nextToken: string) => storeToken(nextToken), []);

  const signOut = useCallback(
    (redirectTo = "/") => {
      clearToken();
      setState({ token: null, profile: null, needsOnboarding: false });
      router.push(redirectTo);
    },
    [router]
  );

  const refreshProfile = useCallback(async () => {
    const current = getTokenSnapshot();
    if (!decode(current)) return;
    try {
      const res = await getMyProfile();
      setState({ token: current, profile: res.profile ?? null, needsOnboarding: !!res.needs_onboarding });
    } catch {
      // keep whatever we already had
    }
  }, []);

  const loaded = state.token === token;

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile: loaded ? state.profile : null,
      needsOnboarding: loaded ? state.needsOnboarding : false,
      ready: !user || loaded,
      isPlayer: user?.role === "player",
      isAdmin: user?.role === "admin",
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, loaded, state, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
