// Shapes mirror the JSON tags on the Go structs in futsalfc-api/internal.

export type LeagueStatus = "active" | "upcoming" | "completed" | string;

export interface League {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: LeagueStatus;
  game_weeks: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  league_id: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  point_deduction: number;
  points: number;
  goal_difference: number;
  league?: League;
  created_at: string;
  updated_at: string;
}

export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface Match {
  id: string;
  league_id: string;
  league: League;
  game_week_id: string | null;
  team1_id: string;
  team2_id: string;
  team1: Team;
  team2: Team;
  team1_score: number;
  team2_score: number;
  team1_loan_count: number;
  team2_loan_count: number;
  status: MatchStatus;
  match_date: string | null;
  goals_tracked: boolean;
  created_at: string;
  updated_at: string;
}

export type GameWeekStatus = "upcoming" | "ongoing" | "completed" | string;

export interface GameWeek {
  id: string;
  league_id: string;
  week_number: number;
  status: GameWeekStatus;
  created_at: string;
  updated_at: string;
}

export interface GameWeekMatchSummary {
  matchId: string;
  hometeamname: string;
  hometeamid: string;
  awayteamname: string;
  awayteamid: string;
  kickoff: string | null;
  status: MatchStatus;
}

export interface GameWeekSummary {
  league_id: string;
  league_name: string;
  week_number: number;
  week_id: string;
  matches: GameWeekMatchSummary[];
}

export type MatchEventType = "goal" | "yellow_card" | "red_card" | "penalty_save";

export interface MatchEvent {
  event_type: MatchEventType;
  player_name: string;
  assist_player_name?: string;
  team_name: string;
  is_home_team: boolean;
}

export interface LineupPlayer {
  player_id: string;
  name: string;
  position: string;
  team_id: string;
  is_loan: boolean;
  loan_from_team?: string;
  loan_from_name?: string;
}

export interface TeamPlayer {
  id: string;
  name: string;
  team_id: string;
  position: string;
}

export interface PlayerDetail {
  playerId?: string;
  name: string;
  team: { name: string; league_name: string };
  player: {
    position: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    penaltySaved: number;
    penaltyMissed: number;
    goalsConceded: number;
    points: number;
    status: number;
  };
}

export interface PlayerStats {
  id: string;
  player_id: string;
  league_id: string | null;
  team_id: string | null;
  goals: number;
  assists: number;
  clean_sheets: number;
  penalty_saves: number;
  penalty_missed: number;
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerStatsWithNames extends PlayerStats {
  player_name: string;
  team_name: string;
  position: string;
}

export interface LeaderboardEntry {
  player_id: string;
  name: string;
  team_id: string;
  team_name: string;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
}

export interface LeaderboardItem {
  label: string;
  value: number;
  player_name: string | null;
  team_name: string | null;
}

/* ---------- Auth & player area ---------- */

export type Role = "player" | "admin" | string;

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  exp: number;
}

export interface LoginResponse {
  token: string;
}

export interface GoogleLoginResponse {
  token: string;
  needsOnboarding: boolean;
  profile?: PlayerDetail;
}

export interface MyProfileResponse {
  role: Role;
  needs_onboarding?: boolean;
  profile: PlayerDetail;
}

export interface CreateProfileResponse {
  role: Role;
  needs_onboarding: boolean;
  profile: PlayerDetail;
}

export type AttendanceStatus = "available" | "unavailable" | string;

export interface AttendanceRow {
  player_id: string;
  player_name: string;
  status: AttendanceStatus;
  position: string;
}

export interface PlayerDue {
  player_id: string;
  remaining: number;
  updated_at?: string;
}

export interface PlayerDueRow {
  player_id: string;
  player_name: string;
  remaining: number;
}
