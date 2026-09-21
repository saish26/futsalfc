import { Accordion } from "@mantine/core";

const RULES: { position: string; rules: string }[] = [
  { position: "Goalkeeper", rules: "Goal +1 · Assist +5 · Clean sheet +8 · Penalty save +8 · Conceding only 1 +3" },
  { position: "Defender", rules: "Goal +1 · Assist +5 · Clean sheet +8 · Conceding only 1 +3" },
  { position: "Midfielder", rules: "Goal +3 · Assist +3" },
  { position: "Striker", rules: "Goal +3 · Assist +3" },
];

/** Mirrors CalculatePoints in the API (internal/playerstats/points.go). */
export default function PointsExplainer() {
  return (
    <Accordion variant="contained" className="rounded-xl border border-line bg-panel">
      <Accordion.Item value="points" style={{ border: "none" }}>
        <Accordion.Control>
          <span className="text-sm font-semibold">How are fantasy points calculated?</span>
        </Accordion.Control>
        <Accordion.Panel>
          <ul className="space-y-2 text-sm">
            {RULES.map((r) => (
              <li key={r.position} className="flex flex-wrap gap-x-2">
                <span className="w-24 shrink-0 font-semibold">{r.position}</span>
                <span className="text-muted">{r.rules}</span>
              </li>
            ))}
            <li className="pt-1 text-xs text-muted">Every missed penalty costs 1 point, whatever the position.</li>
          </ul>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
