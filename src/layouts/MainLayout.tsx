import { IconBallFootball } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/leagues", label: "Leagues" },
  { href: "/stats", label: "Stats" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-pitch text-ink">
              <IconBallFootball size={20} stroke={2} />
            </span>
            <span className="font-display text-xl font-bold tracking-wide uppercase">
              Futsal<span className="text-pitch">FC</span>
            </span>
          </Link>
          <nav className="-mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(item.href) ? "bg-panel-2 text-pitch" : "text-muted hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        FutsalFC · League centre
      </footer>
    </div>
  );
}
