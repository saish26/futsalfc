import { useAuth } from "@/context/AuthContext";
import { initials } from "@/utils/helpers";
import { Avatar, Menu } from "@mantine/core";
import { IconBallFootball, IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/table", label: "Table" },
  { href: "/stats", label: "Stats" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/leagues", label: "Leagues" },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();
  const { user, ready, signOut, isPlayer } = useAuth();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
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

          <div className="shrink-0">
            {!ready ? null : user ? (
              <Menu position="bottom-end" width={200}>
                <Menu.Target>
                  <button className="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3 hover:border-pitch/50">
                    <Avatar size={26} radius="xl" color="green" variant="filled">
                      <span className="text-xs font-bold">{initials(user.name)}</span>
                    </Avatar>
                    <span className="hidden max-w-24 truncate text-sm font-medium sm:block">{user.name}</span>
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{isPlayer ? "Player" : "Admin"}</Menu.Label>
                  <Menu.Item component={Link} href="/me" leftSection={<IconUser size={16} />}>
                    My profile
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => signOut()}>
                    Sign out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Link
                href="/login"
                className="whitespace-nowrap rounded-md bg-pitch px-3 py-1.5 text-sm font-semibold text-ink hover:bg-green-400"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        FutsalFC · League centre
      </footer>
    </div>
  );
}
