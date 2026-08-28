"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ExpenseForm from "@/components/ExpenseForm";
import { fetchExpenses, type ExpenseLog } from "@/lib/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadExpenses() {
    fetchExpenses()
      .then(setExpenses)
      .catch(() => setLoadError("Could not load expenses. Is the API running?"));
  }

  useEffect(loadExpenses, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Operational Expenses</h1>

        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Log New Expense</h2>
          <ExpenseForm onCreated={(e) => setExpenses((prev) => [e, ...prev])} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-100">Expense History</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-slate-800">
                    <td className="p-3 text-slate-400">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="p-3">{e.category}</td>
                    <td className="p-3">{e.description ?? "—"}</td>
                    <td className="p-3 text-right text-red-400">₱{e.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-slate-500">
                      No expenses logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
