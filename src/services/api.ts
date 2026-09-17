import { GetRequest } from "@/utils/http";
import type {
  GameWeek,
  GameWeekSummary,
  LeaderboardEntry,
  LeaderboardItem,
  League,
  LineupPlayer,
  Match,
  MatchEvent,
  PlayerDetail,
  PlayerStats,
  PlayerStatsWithNames,
  Team,
  TeamPlayer,
} from "@/types";

// The axios response interceptor unwraps `response.data`, so each call
// resolves straight to the JSON body.

/* ---------- Leagues ---------- */
export const getLeagues = (): Promise<League[]> => GetRequest("/api/leagues");

export const getLeague = (id: string): Promise<League> =>
  GetRequest(`/api/leagues/${id}`);

export const getLeagueTeams = (id: string): Promise<Team[]> =>
  GetRequest(`/api/leagues/${id}/teams`);

export const getLeagueGameWeeks = (id: string): Promise<GameWeek[]> =>
  GetRequest(`/api/leagues/${id}/gameweeks`);

export const getLeagueFixtures = (id: string): Promise<GameWeekSummary[]> =>
  GetRequest(`/api/leagues/${id}/fixtures`);

export const getCurrentGameWeek = (): Promise<GameWeekSummary> =>
  GetRequest("/api/leagues/gameweeks/current");

/* ---------- Game weeks ---------- */
export const getGameWeek = (id: string): Promise<GameWeek> =>
  GetRequest(`/api/gameweeks/${id}`);

export const getGameWeekMatches = (id: string): Promise<Match[]> =>
  GetRequest(`/api/gameweeks/${id}/matches`);

/* ---------- Matches ---------- */
export const getLeagueMatches = (leagueId: string): Promise<Match[]> =>
  GetRequest(`/api/matches/league/${leagueId}`);

export const getMatch = (id: string): Promise<Match> =>
  GetRequest(`/api/matches/${id}`);

export const getMatchEvents = (id: string): Promise<{ events: MatchEvent[] | null }> =>
  GetRequest(`/api/matches/${id}/events`);

export const getMatchLineup = (matchId: string): Promise<LineupPlayer[] | null> =>
  GetRequest(`/api/lineups/matches/${matchId}/lineup`);

/* ---------- Teams ---------- */
export const getTeams = (): Promise<Team[]> => GetRequest("/api/teams");

export const getTeam = (id: string): Promise<Team> => GetRequest(`/api/teams/${id}`);

export const getTeamPlayers = (teamId: string): Promise<TeamPlayer[] | null> =>
  GetRequest(`/api/teamplayers/teams/${teamId}/players`);

/* ---------- Players ---------- */
export const getPlayers = (): Promise<TeamPlayer[] | null> => GetRequest("/api/players");

export const getPlayerDetail = (playerId: string): Promise<PlayerDetail> =>
  GetRequest(`/api/teamplayers/${playerId}/detail`);

/* ---------- Player stats ---------- */
export const getAllPlayerStats = (): Promise<PlayerStatsWithNames[] | null> =>
  GetRequest("/api/playerstats");

export const getPlayerStats = (playerId: string): Promise<PlayerStats[] | null> =>
  GetRequest(`/api/playerstats/player/${playerId}`);

export const getTopScorer = (leagueId: string): Promise<LeaderboardEntry | null> =>
  GetRequest(`/api/playerstats/league/${leagueId}/top-scorers`);

export const getTopAssists = (leagueId: string): Promise<LeaderboardEntry | null> =>
  GetRequest(`/api/playerstats/league/${leagueId}/top-assists`);

export const getTopYellowCards = (leagueId: string): Promise<LeaderboardEntry | null> =>
  GetRequest(`/api/playerstats/league/${leagueId}/top-yellow-cards`);

export const getCurrentLeaderboards = (): Promise<LeaderboardItem[] | null> =>
  GetRequest("/api/playerstats/leaderboards/current");

/* ---------- Wallet ---------- */
export const getWallet = (): Promise<{ amount: number }> => GetRequest("/api/wallet");
