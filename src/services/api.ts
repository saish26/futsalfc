import { DeleteRequest, GetRequest, PatchRequest, PostRequest, PutRequest } from "@/utils/http";
import type {
  AttendanceRow,
  CardInput,
  CreateProfileResponse,
  CreateUserInput,
  GoalInput,
  GameWeek,
  GameWeekSummary,
  GoogleLoginResponse,
  LeaderboardEntry,
  LeaderboardItem,
  League,
  LeagueInput,
  LineupEntryInput,
  LineupPlayer,
  LoginResponse,
  Match,
  MatchCard,
  MatchEvent,
  MatchInput,
  MatchPenaltySave,
  MatchStatus,
  MyProfileResponse,
  PlayerDetail,
  PenaltySaveInput,
  PlayerDue,
  PlayerDueRow,
  PlayerStats,
  PlayerStatsInput,
  PlayerStatsWithNames,
  ResultInput,
  Team,
  TeamPlayer,
  UnassignedPlayer,
  User,
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

/* =====================================================================
 * Admin writes. Every endpoint below is behind AuthMiddleware + AdminOnly
 * in the API (except teams/players, which the API leaves open today).
 * ===================================================================== */

/* ---------- Leagues ---------- */
export const createLeague = (input: LeagueInput): Promise<{ message: string; data: League }> =>
  PostRequest("/api/leagues", input);

export const updateLeague = (id: string, input: LeagueInput): Promise<{ message: string; data: League }> =>
  PutRequest(`/api/leagues/${id}`, input);

export const updateLeagueStatus = (id: string, status: string): Promise<{ message: string; data: League }> =>
  PutRequest(`/api/leagues/${id}/status`, { status });

export const deleteLeague = (id: string): Promise<{ message: string }> => DeleteRequest(`/api/leagues/${id}`);

export const generateFixtures = (leagueId: string): Promise<{ message: string }> =>
  PostRequest(`/api/leagues/${leagueId}/generate-fixtures`, {});

/* ---------- Game weeks ---------- */
export const updateGameWeekStatus = (id: string, status: string): Promise<{ message: string }> =>
  PatchRequest(`/api/gameweeks/${id}/status`, { status });

/* ---------- Teams & rosters ---------- */
export const createTeam = (input: { name: string; league_id: string }): Promise<{ message: string; data: Team }> =>
  PostRequest("/api/teams", input);

export const updateTeam = (id: string, input: { name: string }): Promise<{ message: string; data: Team }> =>
  PutRequest(`/api/teams/${id}`, input);

export const deleteTeam = (id: string): Promise<{ message: string }> => DeleteRequest(`/api/teams/${id}`);

export const assignPlayerToTeam = (teamId: string, playerId: string): Promise<{ message: string }> =>
  PostRequest(`/api/teamplayers/${teamId}/players/${playerId}`, {});

export const removePlayerFromTeam = (teamId: string, playerId: string): Promise<{ message: string }> =>
  DeleteRequest(`/api/teamplayers/${teamId}/players/${playerId}`);

/* ---------- Players ---------- */
export const getUnassignedPlayers = (): Promise<UnassignedPlayer[] | null> =>
  GetRequest("/api/players/unassigned");

/** The API binds the whole Player row, so send the player back with the fields changed. */
export const updatePlayer = (id: string, player: Record<string, unknown>): Promise<unknown> =>
  PutRequest(`/api/players/${id}`, player);

export const deletePlayer = (id: string): Promise<{ message: string }> => DeleteRequest(`/api/players/${id}`);

/** Admin creates a profile for a user who signed in but never finished onboarding. */
export const createProfileForUser = (userId: string, position: string): Promise<{ message: string }> =>
  PostRequest(`/api/players/${userId}/profile`, { position });

/* ---------- Users ---------- */
export const getUsers = (): Promise<User[] | null> => GetRequest("/api/users");

export const createUser = (input: CreateUserInput): Promise<User> => PostRequest("/api/users", input);

export const updateUser = (id: string, input: Partial<User>): Promise<User> => PutRequest(`/api/users/${id}`, input);

export const deleteUser = (id: string): Promise<void> => DeleteRequest(`/api/users/${id}`);

/* ---------- Matches ---------- */
export const createMatch = (input: MatchInput): Promise<Match> => PostRequest("/api/matches", input);

export const updateMatch = (id: string, input: Partial<MatchInput>): Promise<Match> =>
  PutRequest(`/api/matches/${id}`, input);

export const updateMatchStatus = (id: string, status: MatchStatus): Promise<{ message: string }> =>
  PatchRequest(`/api/matches/${id}/status`, { status });

export const submitResult = (id: string, input: ResultInput): Promise<Match> =>
  PatchRequest(`/api/matches/${id}/result`, input);

export const submitGoal = (id: string, input: GoalInput): Promise<Match> =>
  PostRequest(`/api/matches/${id}/goal`, input);

export const submitCard = (id: string, input: CardInput): Promise<{ message: string }> =>
  PostRequest(`/api/matches/${id}/card`, input);

export const submitPenaltySave = (id: string, input: PenaltySaveInput): Promise<Match> =>
  PostRequest(`/api/matches/${id}/penalty-save`, input);

export const updateLoanCount = (id: string, team1LoanCount: number, team2LoanCount: number): Promise<Match> =>
  PatchRequest(`/api/matches/${id}/loan`, { team1LoanCount, team2LoanCount });

export const deleteMatch = (id: string): Promise<void> => DeleteRequest(`/api/matches/${id}`);

export const getMatchCards = (id: string): Promise<MatchCard[] | null> => GetRequest(`/api/matches/${id}/cards`);

export const getMatchPenaltySaves = (id: string): Promise<MatchPenaltySave[] | null> =>
  GetRequest(`/api/matches/${id}/penalty-saves`);

/* ---------- Lineups ---------- */
export const addLineupPlayers = (
  gameWeekId: string,
  matchId: string,
  teamId: string,
  players: LineupEntryInput[]
): Promise<{ message: string }> =>
  PostRequest(`/api/lineups/admin/game-week/${gameWeekId}/match/${matchId}`, {
    team_id: teamId,
    players,
  });

export const removeLineupPlayer = (
  gameWeekId: string,
  matchId: string,
  teamId: string,
  playerId: string
): Promise<{ message: string }> =>
  DeleteRequest(`/api/lineups/admin/game-week/${gameWeekId}/match/${matchId}/team/${teamId}/player/${playerId}`);

/* ---------- Dues ---------- */
export const setDues = (playerId: string, amount: number): Promise<PlayerDue> =>
  PostRequest(`/api/dues/${playerId}`, { amount });

export const payDues = (playerId: string, amountPaid: number): Promise<PlayerDue> =>
  PostRequest(`/api/dues/${playerId}/pay`, { amount_paid: amountPaid });

/* ---------- Wallet ---------- */
export const walletAdd = (amount: number): Promise<{ amount: number }> =>
  PostRequest("/api/wallet/admin/add", { amount });

export const walletDeduct = (amount: number): Promise<{ amount: number }> =>
  PostRequest("/api/wallet/admin/deduct", { amount });

/* ---------- Player stats ---------- */
export const createPlayerStats = (input: {
  player_id: string;
  league_id: string;
  team_id: string;
} & Partial<PlayerStatsInput>): Promise<{ message: string }> => PostRequest("/api/playerstats", input);

export const updatePlayerStats = (id: string, input: PlayerStatsInput): Promise<{ message: string }> =>
  PutRequest(`/api/playerstats/${id}`, input);

export const deletePlayerStats = (id: string): Promise<{ message: string }> =>
  DeleteRequest(`/api/playerstats/${id}`);
