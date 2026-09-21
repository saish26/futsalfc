# futsalfc-ui

League centre for **futsalfc-api**: standings, fixtures by game week, results, match events and lineups, teams, players and player stats — plus a signed-in area where players see their own stats and set their availability. Next.js (Pages Router) + Mantine + Tailwind.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL axios uses — the API directly (`http://localhost:8080`), or `/backend` to go through the Next rewrite. |
| `CLIENT_ID` | Google **Web** OAuth client ID. Empty hides the Google button and shows a setup hint. |
| `API_PROXY_TARGET` | Only used with `/backend`: where that rewrite forwards to. |

## Google sign-in

Players sign in with Google; admins sign in with email and password (the API rejects Google sign-in for admin accounts).

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**. An Android/iOS client ID will not work — the API validates the ID token's audience against a web client ID.
2. Authorised JavaScript origins: `http://localhost:3000` for local work, plus the deployed origin.
3. Put the client ID in `CLIENT_ID` here **and** in `google.client_id` in the API's `config.yml` — they must match.
4. Restart both the API and `npm run dev`.

### Sign-in flow

```
/login  → Google (players) or email+password (admins)
        → JWT stored in the "token" cookie, sent as Authorization: Bearer by the axios interceptor
        → new player (needsOnboarding) → /onboarding → pick position → POST /api/players/profile
        → /me
```

## Structure

```
src/
  config/axios.ts       axios instance (token cookie, unwraps response.data)
  utils/http.ts         GetRequest / PostRequest / ... wrappers
  utils/tokenStore.ts   auth cookie as an external store (useSyncExternalStore)
  context/AuthContext   current user (from the JWT) + profile, signIn / signOut
  services/api.ts       one function per endpoint
  types/index.ts        response types mirroring the Go structs
  hooks/useApi.ts       tiny fetch hook (loading / error / reload)
  components/           MatchCard, StandingsTable, LeagueStats, AvailabilityCard, RequireAuth, ...
  pages/
    index.tsx               home: active league, current game week, table, leaders
    login.tsx               Google sign-in for players, email/password for admins
    onboarding.tsx          new players pick a position
    me/index.tsx            player: own stats, team fixtures, availability, dues
                            admin: dues overview and who is unavailable
    leagues/index.tsx       all leagues
    leagues/[id].tsx        tabs: standings, fixtures, results, player stats, teams
    fixtures.tsx, table.tsx shortcuts into the current league's tabs
    gameweeks/[id].tsx      matches in a game week + prev/next
    matches/[id].tsx        scoreboard, events, lineups (falls back to squads)
    teams/index.tsx, teams/[id].tsx
    players/index.tsx, players/[id].tsx
    stats.tsx               player leaderboard with league picker
```

Admin write endpoints (creating leagues, fixtures, results, dues, wallet) are not in this UI yet — the admin view is read-only.
