"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@vessel/shared";

interface NavLink {
  href: string;
  label: string;
  ownerOnly?: boolean;
  icon: ReactNode;
}

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  idCard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5 16c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5" />
      <path d="M14 9h5M14 13h5" />
    </svg>
  ),
  scan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  cargo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 8l9-5 9 5-9 5-9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  expenses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  fare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  ),
};

const NAV_LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: ICONS.dashboard },
  { href: "/admin/registration", label: "Pass Registration", icon: ICONS.idCard },
  { href: "/scan", label: "Gate Scanner", icon: ICONS.scan },
  { href: "/admin/cargo", label: "Cargo Log", icon: ICONS.cargo },
  { href: "/admin/expenses", label: "Expenses", icon: ICONS.expenses },
  { href: "/owner/fares", label: "Fare Settings", ownerOnly: true, icon: ICONS.fare },
  { href: "/owner/audit", label: "Audit Reports", ownerOnly: true, icon: ICONS.audit },
];

export default function Sidebar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 print:hidden">
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
            <path d="M3 17h18M4 17l1-8h14l1 8M9 9V5h6v4" />
            <path d="M6 13h12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-100">Vessel Ticketing</p>
          <p className="text-xs text-slate-500">Operations Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.filter((link) => !link.ownerOnly || user.role === "OWNER").map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100")
                  }
                >
                  <span className="h-4 w-4 shrink-0">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="truncate text-slate-300">{user.username}</span>
          <span
            className={
              "rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide " +
              (user.role === "OWNER"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-cyan-500/15 text-cyan-300")
            }
          >
            {user.role}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-slate-100"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
