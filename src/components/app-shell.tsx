"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useFinance } from "@/lib/finance-context";
import { cn } from "@/lib/utils";
import {
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Financial data", icon: Settings2 },
  { href: "/forecast", label: "Projection", icon: TrendingUp },
  { href: "/sandbox", label: "What-if", icon: FlaskConical },
];

const dataPaths = ["/accounts", "/income", "/obligations", "/pipeline"];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut, ready } = useAuth();
  const { profile } = useFinance();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, router, user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  const nav = (
    <nav className="grid gap-1 lg:flex lg:flex-row lg:items-center">
      {links.map((link) => {
        const Icon = link.icon;
        const active = link.href === "/accounts" ? dataPaths.includes(pathname) : pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="shrink-0">
            <p className="font-heading text-2xl tracking-tight">Runway</p>
          </Link>
          <div className="hidden flex-1 justify-center lg:flex">{nav}</div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-sidebar-foreground/60">{profile.settings.horizonDays}-day view</p>
            </div>
          <Button
            variant="outline"
              size="icon"
              aria-label="Sign out"
              className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
          >
            <LogOut className="size-4" />
          </Button>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Sign out"
              className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation"
              className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setOpen((value) => !value)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
        {open ? <div className="border-t border-sidebar-border p-3 lg:hidden">{nav}</div> : null}
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">{children}</main>
    </div>
  );
}
