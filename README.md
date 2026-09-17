# futsalfc-ui

Read-only league centre for **futsalfc-api**: standings, fixtures by game week, results, match events and lineups, teams, players and player stats. Next.js (Pages Router) + Mantine + Tailwind.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL axios uses. Default `/backend` goes through the Next rewrite. |
| `API_PROXY_TARGET` | Where `/backend/*` is forwarded (the Go API, e.g. `http://localhost:8080`). |

The Go API has no CORS middleware, so the browser calls `/backend/...` on the Next server, which proxies to the API. If CORS is added to the API later, you can point `NEXT_PUBLIC_API_BASE_URL` straight at it.

## Structure

```
src/
  config/axios.ts     axios instance (token cookie, unwraps response.data)
  utils/http.ts       GetRequest / PostRequest / ... wrappers
  services/api.ts     one function per GET endpoint
  types/index.ts      response types mirroring the Go structs
  hooks/useApi.ts     tiny fetch hook (loading / error / reload)
  components/         MatchCard, StandingsTable, LeagueStats, ...
  pages/
    index.tsx               home: active league, current game week, table, leaders
    leagues/index.tsx       all leagues
    leagues/[id].tsx        tabs: standings, fixtures, results, player stats, teams
    gameweeks/[id].tsx      matches in a game week + prev/next
    matches/[id].tsx        scoreboard, events, lineups (falls back to squads)
    teams/index.tsx, teams/[id].tsx
    players/index.tsx, players/[id].tsx
    stats.tsx               player leaderboard with league picker
```
