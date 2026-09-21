import { DeleteRequest, GetRequest, PostRequest } from "@/utils/http";
import type {
  AttendanceRow,
  CreateProfileResponse,
  GameWeek,
  GameWeekSummary,
  GoogleLoginResponse,
  LeaderboardEntry,
  LeaderboardItem,
  League,
  LoginResponse,
  LineupPlayer,
  Match,
  MatchEvent,
  MyProfileResponse,
  PlayerDetail,
  PlayerDue,
  PlayerDueRow,
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

/* ---------- Auth (public) ---------- */
export const login = (email: string, password: string): Promise<LoginResponse> =>
  PostRequest("/api/auth/login", { email, password });

export const googleLogin = (idToken: string): Promise<GoogleLoginResponse> =>
  PostRequest("/api/auth/google", { id_token: idToken });

/* ---------- Signed-in player ---------- */
export const getMyProfile = (): Promise<MyProfileResponse> => GetRequest("/api/players/me");

export const createProfile = (position: string): Promise<CreateProfileResponse> =>
  PostRequest("/api/players/profile", { position });

/* ---------- Attendance (signed in) ---------- */
export const markUnavailable = (gameWeekId: string): Promise<{ message: string }> =>
  PostRequest("/api/attendance/unavailable", { game_week_id: gameWeekId });

export const undoUnavailable = (gameWeekId: string): Promise<{ message: string }> =>
  DeleteRequest("/api/attendance/unavailable", { game_week_id: gameWeekId });

export const getTeamAttendance = (teamId: string, gameWeekId: string): Promise<AttendanceRow[] | null> =>
  GetRequest(`/api/attendance/team/${teamId}/game-week/${gameWeekId}`);

export const getUnavailableByWeek = (gameWeekId: string): Promise<AttendanceRow[] | null> =>
  GetRequest(`/api/attendance/unavailable/game-week/${gameWeekId}`);

export const getAllUnavailable = (): Promise<AttendanceRow[] | null> =>
  GetRequest("/api/attendance/unavailable");

/* ---------- Dues (signed in) ---------- */
export const getMyDues = (playerId: string): Promise<PlayerDue> => GetRequest(`/api/dues/${playerId}`);

export const getAllDues = (): Promise<PlayerDueRow[] | null> => GetRequest("/api/dues");
