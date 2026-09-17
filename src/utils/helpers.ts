import dayjs from "dayjs";
import type { Match, MatchStatus, Team } from "@/types";

export const formatDate = (value?: string | null, format = "D MMM YYYY") => {
  if (!value) return "TBD";
  const d = dayjs(value);
  // Go zero time ("0001-01-01T00:00:00Z") means "not set"
  if (!d.isValid() || d.year() <= 1) return "TBD";
  return d.format(format);
};

export const formatKickoff = (value?: string | null) => formatDate(value, "ddd, D MMM · h:mm A");

export const sortStandings = (teams: Team[]) =>
  [...teams].sort(
    (a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.name.localeCompare(b.name)
  );

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const CREST_COLORS = [
  "#16a34a",
  "#2563eb",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#65a30d",
  "#ea580c",
];

export const crestColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CREST_COLORS[h % CREST_COLORS.length];
};

export const capitalize = (s = "") => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const statusColor = (status?: string) => {
  switch (status) {
    case "live":
    case "ongoing":
    case "active":
      return "red";
    case "completed":
      return "gray";
    case "cancelled":
      return "dark";
    case "scheduled":
    case "upcoming":
    default:
      return "green";
  }
};

export const isFinished = (status?: MatchStatus) => status === "completed";
export const hasScore = (m: Pick<Match, "status">) => m.status === "completed" || m.status === "live";

export const pickActiveLeague = <T extends { status: string; start_date: string }>(leagues: T[] = []) =>
  leagues.find((l) => l.status === "active") ??
  [...leagues].sort((a, b) => dayjs(b.start_date).valueOf() - dayjs(a.start_date).valueOf())[0];
