"use client";

import { useState, type FormEvent } from "react";
import { createExpense, type ExpenseLog } from "@/lib/api";

const EXPENSE_CATEGORIES = ["Fuel", "Port Fees", "Maintenance", "Other"];

export default function ExpenseForm({ onCreated }: { onCreated: (entry: ExpenseLog) => void }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const entry = await createExpense({
        category,
        amount: Number(amount),
        description: description || undefined,
      });
      setStatus("Expense logged.");
      setAmount("");
      setDescription("");
      onCreated(entry);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Expense entry failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      >
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        required
        type="number"
        min={0}
        step="0.01"
        placeholder="Amount (₱)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950">
        Log expense
      </button>
      {status && <p className="text-sm text-slate-400">{status}</p>}
    </form>
  );
}
