import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  back?: { href: string; label: string };
}

export default function PageHeader({ eyebrow, title, subtitle, right, back }: Props) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-muted hover:text-white">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-pitch">{eyebrow}</div>}
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl">{title}</h1>
          {subtitle && <div className="mt-2 text-sm text-muted">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}
