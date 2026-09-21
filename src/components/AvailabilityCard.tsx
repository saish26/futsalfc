import { useApi } from "@/hooks/useApi";
import { getGameWeek, getTeamAttendance, markUnavailable, undoUnavailable } from "@/services/api";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Panel } from "./Section";
import { LoadingBlock } from "./States";

interface Props {
  playerId: string;
  teamId?: string;
  gameWeekId?: string;
  weekNumber?: number;
  onChanged?: () => void;
}

export default function AvailabilityCard({ playerId, teamId, gameWeekId, weekNumber, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const week = useApi(() => getGameWeek(gameWeekId!), [gameWeekId], !!gameWeekId);
  const roster = useApi(
    () => getTeamAttendance(teamId!, gameWeekId!),
    [teamId, gameWeekId],
    !!teamId && !!gameWeekId
  );

  const mine = (roster.data ?? []).find((r) => r.player_id === playerId);
  const available = mine ? mine.status !== "unavailable" : true;
  // The API only accepts attendance changes while the game week is still upcoming.
  const locked = !!week.data && week.data.status !== "upcoming";

  const toggle = async () => {
    if (!gameWeekId) return;
    setBusy(true);
    try {
      if (available) {
        await markUnavailable(gameWeekId);
        notifications.show({ color: "yellow", message: "Marked unavailable for this game week" });
      } else {
        await undoUnavailable(gameWeekId);
        notifications.show({ color: "green", message: "You're available again" });
      }
      roster.reload();
      onChanged?.();
    } catch (err) {
      notifications.show({ color: "red", message: typeof err === "string" ? err : "Couldn't update availability" });
    } finally {
      setBusy(false);
    }
  };

  if (!gameWeekId) {
    return (
      <Panel className="p-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">Availability</h3>
        <p className="mt-1 text-sm text-muted">No upcoming game week right now.</p>
      </Panel>
    );
  }

  if (!teamId) {
    return (
      <Panel className="p-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">Availability</h3>
        <p className="mt-1 text-sm text-muted">
          You&apos;ll be able to set your availability once an admin adds you to a team.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">Availability</h3>
          <p className="text-xs text-muted">Game week {weekNumber ?? "–"}</p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            available ? "bg-pitch/15 text-pitch" : "bg-yellow-500/15 text-yellow-400"
          }`}
        >
          {available ? <IconCheck size={14} /> : <IconX size={14} />}
          {available ? "Available" : "Unavailable"}
        </span>
      </div>

      {roster.loading || week.loading ? (
        <LoadingBlock rows={1} height={36} />
      ) : (
        <>
          <Button
            fullWidth
            variant={available ? "light" : "filled"}
            color={available ? "yellow" : "green"}
            loading={busy}
            disabled={locked}
            onClick={toggle}
          >
            {available ? "Mark me unavailable" : "I'm available again"}
          </Button>
          {locked && (
            <p className="mt-2 text-xs text-muted">
              This game week is {week.data?.status}, so availability is locked. Talk to an admin.
            </p>
          )}
          {!locked && (
            <p className="mt-2 text-xs text-muted">
              Tell your captain early — lineups are picked from available players.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
