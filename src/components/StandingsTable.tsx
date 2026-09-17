import type { Team } from "@/types";
import { sortStandings } from "@/utils/helpers";
import { Table } from "@mantine/core";
import Link from "next/link";
import TeamCrest from "./TeamCrest";

interface Props {
  teams: Team[];
  compact?: boolean;
  highlightId?: string;
}

export default function StandingsTable({ teams, compact = false, highlightId }: Props) {
  const rows = sortStandings(teams);
  const anyDeduction = rows.some((t) => t.point_deduction);

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <Table
        verticalSpacing={compact ? 6 : "sm"}
        horizontalSpacing="sm"
        className="tabular"
        styles={{ th: { color: "var(--color-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" } }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={36}>#</Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th ta="center">P</Table.Th>
            {!compact && (
              <>
                <Table.Th ta="center">W</Table.Th>
                <Table.Th ta="center">D</Table.Th>
                <Table.Th ta="center">L</Table.Th>
                <Table.Th ta="center">GF</Table.Th>
                <Table.Th ta="center">GA</Table.Th>
              </>
            )}
            <Table.Th ta="center">GD</Table.Th>
            {!compact && anyDeduction && <Table.Th ta="center">Ded</Table.Th>}
            <Table.Th ta="center">Pts</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((t, i) => (
            <Table.Tr key={t.id} className={t.id === highlightId ? "bg-pitch/10" : ""}>
              <Table.Td>
                <span className={`font-display text-base font-bold ${i === 0 ? "text-pitch" : "text-muted"}`}>{i + 1}</span>
              </Table.Td>
              <Table.Td>
                <Link href={`/teams/${t.id}`} className="flex min-w-0 items-center gap-2 hover:text-pitch">
                  <TeamCrest name={t.name} size={compact ? 22 : 26} />
                  <span className="truncate font-medium">{t.name}</span>
                </Link>
              </Table.Td>
              <Table.Td ta="center">{t.played}</Table.Td>
              {!compact && (
                <>
                  <Table.Td ta="center">{t.won}</Table.Td>
                  <Table.Td ta="center">{t.draw}</Table.Td>
                  <Table.Td ta="center">{t.lost}</Table.Td>
                  <Table.Td ta="center">{t.goals_for}</Table.Td>
                  <Table.Td ta="center">{t.goals_against}</Table.Td>
                </>
              )}
              <Table.Td ta="center">
                {t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference}
              </Table.Td>
              {!compact && anyDeduction && (
                <Table.Td ta="center" className={t.point_deduction ? "text-red-400" : "text-muted"}>
                  {t.point_deduction ? `-${t.point_deduction}` : "–"}
                </Table.Td>
              )}
              <Table.Td ta="center">
                <span className="font-display text-lg font-bold">{t.points}</span>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
