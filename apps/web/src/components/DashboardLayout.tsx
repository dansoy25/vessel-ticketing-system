"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@vessel/shared";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: Role;
}) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user && requireRole && user.role !== requireRole) {
      router.replace("/admin");
    }
  }, [ready, user, requireRole, router]);

  if (!ready || !user || (requireRole && user.role !== requireRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar user={user} onLogout={logout} />
      <main className="h-screen flex-1 overflow-y-auto px-6 py-6 print:h-auto print:overflow-visible print:p-0">
        {children}
      </main>
    </div>
  );
}
