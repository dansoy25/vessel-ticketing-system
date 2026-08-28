"use client";

import type { PassengerCategory, PaymentMethod } from "@vessel/shared";
import { formatTimestamp } from "@/lib/format";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

export interface PaymentReceiptData {
  passengerName: string;
  category: PassengerCategory;
  ridesPurchased: number;
  baseFare: number;
  discountRate: number;
  discountAmount: number;
  totalFee: number;
  remainingRidesBalance: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string | null;
  amountTendered?: number;
  changeDue?: number;
  issuedBy: string;
  timestamp: string;
}

export default function PaymentReceiptDocument({
  receipt,
  onClose,
}: {
  receipt: PaymentReceiptData;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        id="receipt"
        className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-lg bg-white p-6 text-slate-950"
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Vessel Ticketing System</p>
          <h2 className="text-lg font-semibold">Official Payment Receipt</h2>
        </div>

        <div className="w-full text-sm">
          <Row label="Passenger" value={receipt.passengerName} />
          <Row label="Category" value={CATEGORY_LABELS[receipt.category] ?? receipt.category} />
          <Row label="Rides Purchased" value={String(receipt.ridesPurchased)} />
          <Row label="Payment Method" value={receipt.paymentMethod} />
          {receipt.paymentMethod === "CASH" ? (
            <>
              <Row label="Cash Tendered" value={`₱${(receipt.amountTendered ?? 0).toFixed(2)}`} />
              <Row label="Change Due" value={`₱${(receipt.changeDue ?? 0).toFixed(2)}`} />
            </>
          ) : (
            <Row
              label={receipt.paymentMethod === "GCASH" ? "GCash Ref" : "Card Transaction Ref"}
              value={receipt.paymentRef ?? "—"}
            />
          )}
          <Row label="Base Fare" value={`₱${receipt.baseFare.toFixed(2)}`} />
          <Row
            label="Discount Applied"
            value={`${(receipt.discountRate * 100).toFixed(0)}% (−₱${receipt.discountAmount.toFixed(2)})`}
          />
          <Row label="Total Fee Paid" value={`₱${receipt.totalFee.toFixed(2)}`} />
          <Row label="Available Rides Balance" value={String(receipt.remainingRidesBalance)} />
          <Row label="Date & Time" value={formatTimestamp(receipt.timestamp)} />
          <Row label="Issued By" value={receipt.issuedBy} />
        </div>
      </div>
      <div className="flex justify-center gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950"
        >
          Print
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 py-1 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="break-all text-right font-medium">{value}</span>
    </div>
  );
}
