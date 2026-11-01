import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AdminToolbar } from "@/components/admin/class-filter";

const LINKS = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/leaderboard", label: "Leaderboard" },
  { to: "/admin/students", label: "Students" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-[calc(100vh-52px)] md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b-[3px] border-foreground bg-card p-4 md:border-b-0 md:border-r-[3px]">
        <p className="font-display text-xs uppercase tracking-wide text-muted-foreground">Tutor desk</p>
        <nav className="mt-3 flex gap-2 md:flex-col">
          {LINKS.map((link) => {
            const active = link.to === "/admin"
              ? path === "/admin" || path === "/admin/"
              : path === link.to || path.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-xl px-3 py-2 font-display font-bold ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-6 font-display text-xs uppercase tracking-wide text-muted-foreground">Preview games</p>
        <nav className="mt-3 flex gap-2 md:flex-col">
          <Link to="/" className="rounded-xl px-3 py-2 font-display font-bold hover:bg-secondary">Machines</Link>
          <Link to="/studio" className="rounded-xl px-3 py-2 font-display font-bold hover:bg-secondary">Phone games</Link>
          <Link to="/hacker" className="rounded-xl px-3 py-2 font-display font-bold hover:bg-secondary">Hacker</Link>
        </nav>
      </aside>
      <div className="min-w-0 p-4 md:p-8">
        <AdminToolbar />
        {children}
      </div>
    </div>
  );
}
