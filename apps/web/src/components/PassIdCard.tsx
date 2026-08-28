"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Passenger } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  REGULAR: "bg-sky-100 text-sky-700",
  STUDENT: "bg-violet-100 text-violet-700",
  PWD: "bg-orange-100 text-orange-700",
  SENIOR: "bg-amber-100 text-amber-700",
  CHILD_UNDER_7: "bg-pink-100 text-pink-700",
};

export default function PassIdCard({
  passenger,
  onClose,
}: {
  passenger: Passenger;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(passenger.qrToken, { margin: 1, width: 180 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [passenger.qrToken]);

  return (
    <div className="flex flex-col gap-4">
      <div
        id="receipt"
        className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border-2 border-slate-300 bg-white p-6 text-slate-950"
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Vessel Ticketing System</p>
          <h2 className="text-lg font-semibold">Official Pass</h2>
        </div>

        <div className="flex flex-col items-center gap-2">
          {qrDataUrl && <img src={qrDataUrl} alt="Permanent pass QR code" className="h-36 w-36" />}
          <p className="text-base font-semibold">{passenger.fullName}</p>
          <span
            className={
              "rounded-full px-3 py-1 text-xs font-semibold " +
              (CATEGORY_BADGE_CLASSES[passenger.category] ?? "bg-slate-100 text-slate-700")
            }
          >
            {CATEGORY_LABELS[passenger.category] ?? passenger.category}
          </span>
          <p className="break-all text-center text-xs text-slate-500">Pass ID: {passenger.qrToken}</p>
        </div>

        <p className="text-center text-xs text-slate-400">
          Keep this card for gate scanning and pass reloads.
        </p>
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
