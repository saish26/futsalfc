import { crestColor, initials } from "@/utils/helpers";

interface Props {
  name?: string;
  size?: number;
}

export default function TeamCrest({ name = "", size = 36 }: Props) {
  const color = crestColor(name);
  return (
    <span
      aria-hidden
      className="font-display inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(145deg, ${color}, ${color}99)`,
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.12)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
