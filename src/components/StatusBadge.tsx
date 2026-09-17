import { capitalize, statusColor } from "@/utils/helpers";
import { Badge } from "@mantine/core";

export default function StatusBadge({ status, size = "sm" }: { status?: string; size?: "xs" | "sm" | "md" }) {
  if (!status) return null;
  const live = status === "live" || status === "ongoing";
  return (
    <Badge
      size={size}
      radius="sm"
      variant={live ? "filled" : "light"}
      color={statusColor(status)}
      leftSection={live ? <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" /> : null}
    >
      {capitalize(status)}
    </Badge>
  );
}
