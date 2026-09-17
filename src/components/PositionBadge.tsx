import { Badge } from "@mantine/core";

const SHORT: Record<string, { label: string; color: string }> = {
  goalkeeper: { label: "GK", color: "yellow" },
  defender: { label: "DEF", color: "blue" },
  midfielder: { label: "MID", color: "teal" },
  striker: { label: "FWD", color: "red" },
};

export default function PositionBadge({ position }: { position?: string }) {
  const p = SHORT[(position || "").toLowerCase()];
  if (!p) return position ? <Badge size="xs" variant="light" color="gray">{position}</Badge> : null;
  return (
    <Badge size="xs" variant="light" color={p.color} radius="sm" title={position}>
      {p.label}
    </Badge>
  );
}
