import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  action?: { href: string; label: string };
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, action, right, children, className = "" }: Props) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
        {right}
        {action && (
          <Link href={action.href} className="text-sm font-medium text-pitch hover:underline">
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-panel ${className}`}>{children}</div>;
}
