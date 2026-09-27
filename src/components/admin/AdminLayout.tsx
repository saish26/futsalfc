import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import type { ReactNode } from "react";
import RequireAdmin from "./RequireAdmin";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leagues", label: "Leagues" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/dues", label: "Dues" },
  { href: "/admin/wallet", label: "Wallet" },
];

interface Props {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, subtitle, right, children }: Props) {
  const { pathname } = useRouter();

  return (
    <RequireAdmin>
      <Head>
        <title>{title} · Admin · FutsalFC</title>
      </Head>

      <nav className="-mx-1 mb-6 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-pitch text-ink" : "bg-panel text-muted hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <PageHeader eyebrow="Admin" title={title} subtitle={subtitle} right={right} />
      {children}
    </RequireAdmin>
  );
}
