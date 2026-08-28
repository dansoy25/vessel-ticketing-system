"use client";

import type { ScanResponse } from "@vessel/shared";
import { formatTimestamp } from "@/lib/format";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

export default function GateVerificationSlip({
  result,
  gateId,
}: {
  result: ScanResponse;
  gateId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        id="receipt"
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 rounded-lg bg-white p-6 text-slate-950"
      >
        <p className="text-xs uppercase tracking-wide text-slate-500">Vessel Ticketing System</p>
        <h2 className="text-lg font-semibold">Gate Entry Pass Slip</h2>
        <div className="w-full text-sm">
          <Row label="Gate / Turnstile ID" value={gateId} />
          <Row label="Passenger" value={result.passengerName ?? "—"} />
          <Row
            label="Category"
            value={result.category ? (CATEGORY_LABELS[result.category] ?? result.category) : "—"}
          />
          <Row
            label="Entry Timestamp"
            value={result.scannedAt ? formatTimestamp(result.scannedAt) : "—"}
          />
          <Row label="Fare Action" value="-1 Ride Deducted" />
          <Row label="Remaining Rides Balance" value={String(result.remainingRides ?? 0)} />
        </div>
        <p className="mt-1 text-xs text-slate-400">Proof of passage — keep for your records.</p>
      </div>
      <div className="flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950"
        >
          Print slip
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 py-1 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
