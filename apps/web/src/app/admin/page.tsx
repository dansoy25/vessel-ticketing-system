"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ScanActivityFeed from "@/components/ScanActivityFeed";
import QuickActions from "@/components/QuickActions";
import RevenueTrendChart, { type TrendPoint } from "@/components/RevenueTrendChart";
import DonutChart, { type DonutSlice } from "@/components/DonutChart";
import {
  fetchCargoEntries,
  fetchDailyBreakdown,
  fetchExpenses,
  fetchPassengers,
  fetchScanFeed,
  type CargoEntry,
  type DailyBreakdown,
  type ExpenseLog,
  type Passenger,
  type ScanFeed,
} from "@/lib/api";

const FEED_REFRESH_MS = 8_000;

const CATEGORY_COLORS: Record<string, string> = {
  REGULAR: "#38bdf8",
  STUDENT: "#a78bfa",
  PWD: "#fb923c",
  SENIOR: "#facc15",
  CHILD_UNDER_7: "#f472b6",
};

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

type TrendRange = "7D" | "30D";

export default function AdminDashboardPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [cargoEntries, setCargoEntries] = useState<CargoEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [daily, setDaily] = useState<DailyBreakdown[]>([]);
  const [scanFeed, setScanFeed] = useState<ScanFeed | null>(null);
  const [trendRange, setTrendRange] = useState<TrendRange>("7D");
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadAll() {
    Promise.all([fetchPassengers(), fetchCargoEntries(), fetchExpenses(), fetchDailyBreakdown()])
      .then(([p, c, e, d]) => {
        setPassengers(p);
        setCargoEntries(c);
        setExpenses(e);
        setDaily(d);
      })
      .catch(() => setLoadError("Could not load dashboard data. Is the API running?"));
  }

  function loadFeed() {
    fetchScanFeed()
      .then(setScanFeed)
      .catch(() => setLoadError("Could not load scan activity. Is the API running?"));
  }

  useEffect(() => {
    loadAll();
    loadFeed();
    const interval = setInterval(loadFeed, FEED_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const grossRevenue =
      passengers.reduce((sum, p) => sum + p.feePaid, 0) +
      cargoEntries.reduce((sum, c) => sum + c.fee, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      totalPassHolders: passengers.length,
      totalExpenses,
      netRevenue: grossRevenue - totalExpenses,
    };
  }, [passengers, cargoEntries, expenses]);

  const trendData: TrendPoint[] = useMemo(() => {
    const rangeSize = trendRange === "7D" ? 7 : 30;
    return [...daily]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-rangeSize)
      .map((d) => ({
        label: d.date.slice(5),
        revenue: d.ticketRevenue + d.cargoRevenue,
        expenses: d.expenses,
      }));
  }, [daily, trendRange]);

  const categoryBreakdown: DonutSlice[] = useMemo(() => {
    const counts = passengers.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
      label,
      value: counts[category] ?? 0,
      color: CATEGORY_COLORS[category],
    }));
  }, [passengers]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Admin Dashboard</h1>

        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Passengers Boarded Today"
            value={`${scanFeed?.boardedToday ?? 0} / ${stats.totalPassHolders}`}
            tone="green"
          />
          <StatCard label="Active Pass Holders" value={String(stats.totalPassHolders)} tone="lightGreen" />
          <StatCard label="Logged Expenses" value={`₱${stats.totalExpenses.toFixed(2)}`} tone="orange" />
          <StatCard label="Net Revenue" value={`₱${stats.netRevenue.toFixed(2)}`} tone="darkRed" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Revenue &amp; Expenses Trend</h2>
              <div className="flex gap-1 rounded-lg bg-slate-950 p-1 text-xs">
                {(["7D", "30D"] as TrendRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={
                      "rounded px-2 py-1 font-medium " +
                      (trendRange === r ? "bg-cyan-500 text-slate-950" : "text-slate-400")
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <RevenueTrendChart data={trendData} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-100">Passenger Category Breakdown</h2>
            <DonutChart data={categoryBreakdown} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-100">Live Gate Feed</h2>
            <ScanActivityFeed items={scanFeed?.recent ?? []} />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-100">Quick Actions</h2>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
