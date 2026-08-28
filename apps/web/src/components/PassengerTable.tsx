"use client";

import { useMemo, useState } from "react";
import type { Passenger } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

export default function PassengerTable({
  passengers,
  onReload,
  onPrintPassId,
  onPrintReceipt,
}: {
  passengers: Passenger[];
  onReload: (passenger: Passenger) => void;
  onPrintPassId: (passenger: Passenger) => void;
  onPrintReceipt: (passenger: Passenger) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passengers;
    return passengers.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.qrToken.toLowerCase().includes(q),
    );
  }, [passengers, query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        placeholder="Search by name, phone, or Pass ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-900 text-slate-400">
            <tr>
              <th className="p-3 font-medium">Pass ID</th>
              <th className="p-3 font-medium">Passenger Name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Rides Balance</th>
              <th className="p-3 font-medium">Last Activity</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="p-3 font-mono text-xs text-slate-400">{p.qrToken.slice(0, 8)}…</td>
                <td className="p-3">{p.fullName}</td>
                <td className="p-3">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                <td className="p-3">
                  {p.remainingRides} / {p.totalRides}
                </td>
                <td className="p-3 text-slate-400">{new Date(p.lastActivityAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onReload(p)}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium hover:border-cyan-500 hover:text-cyan-300"
                    >
                      Reload Pass
                    </button>
                    <button
                      onClick={() => onPrintPassId(p)}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium hover:border-cyan-500 hover:text-cyan-300"
                    >
                      Print Pass ID
                    </button>
                    <button
                      onClick={() => onPrintReceipt(p)}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium hover:border-cyan-500 hover:text-cyan-300"
                    >
                      Print Receipt
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-slate-500">
                  {passengers.length === 0 ? "No pass holders registered yet." : "No matches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
