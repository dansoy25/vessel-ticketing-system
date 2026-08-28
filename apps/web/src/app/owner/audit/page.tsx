"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  fetchActivity,
  fetchDailyBreakdown,
  type ActivityEvent,
  type DailyBreakdown,
} from "@/lib/api";

const LIVE_REFRESH_MS = 8_000;

const ACTIVITY_LABELS: Record<ActivityEvent["type"], string> = {
  PASSENGER_REGISTRATION: "Pass Registration",
  PASSENGER_TOPUP: "Pass Reload",
  CARGO: "Cargo Entry",
  EXPENSE: "Expense Log",
  GATE_SCAN: "Gate Scan",
};

export default function AuditReportsPage() {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [daily, setDaily] = useState<DailyBreakdown[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadReports() {
    Promise.all([fetchActivity(), fetchDailyBreakdown()])
      .then(([a, d]) => {
        setActivity(a);
        setDaily(d);
      })
      .catch(() => setLoadError("Could not load audit data. Is the API running?"));
  }

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, LIVE_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout requireRole="OWNER">
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Audit Reports</h1>

        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-100">Real-Time Activity Feed</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">Event</th>
                  <th className="p-3 font-medium">Details</th>
                  <th className="p-3 font-medium">Operator</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={`${a.type}-${a.id}`} className="border-t border-slate-800">
                    <td className="p-3 text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-3">{ACTIVITY_LABELS[a.type]}</td>
                    <td className="p-3">{a.label}</td>
                    <td className="p-3 text-slate-400">{a.operatorName}</td>
                    <td
                      className={
                        "p-3 text-right " + (a.amount < 0 ? "text-red-400" : "text-emerald-400")
                      }
                    >
                      {a.amount === 0 ? "—" : `${a.amount < 0 ? "-" : ""}₱${Math.abs(a.amount).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
                {activity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-slate-500">
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-100">Financial Audit — Daily Breakdown</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium text-right">Ticket Revenue</th>
                  <th className="p-3 font-medium text-right">Cargo Revenue</th>
                  <th className="p-3 font-medium text-right">Expenses</th>
                  <th className="p-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date} className="border-t border-slate-800">
                    <td className="p-3">{d.date}</td>
                    <td className="p-3 text-right">₱{d.ticketRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right">₱{d.cargoRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-red-400">₱{d.expenses.toFixed(2)}</td>
                    <td
                      className={
                        "p-3 text-right font-medium " + (d.net < 0 ? "text-red-400" : "text-emerald-400")
                      }
                    >
                      ₱{d.net.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {daily.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-slate-500">
                      No financial activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
