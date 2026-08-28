"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import type { ScanResponse } from "@vessel/shared";
import { submitScan } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import GateVerificationSlip from "@/components/GateVerificationSlip";

const SCANNER_ELEMENT_ID = "gate-scanner";
const GATE_ID = "gate-1";

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lastResult?.result !== "OK") return;
    const timer = setTimeout(() => window.print(), 200);
    return () => clearTimeout(timer);
  }, [lastResult]);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (qrToken) => {
          if (busyRef.current) return;
          busyRef.current = true;
          try {
            const result = await submitScan({ qrToken, gateId: GATE_ID });
            setLastResult(result);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Scan failed");
          } finally {
            setTimeout(() => {
              busyRef.current = false;
            }, 1000);
          }
        },
        () => {
          // ignore per-frame decode failures
        },
      )
      .catch((err) => setError(err instanceof Error ? err.message : "Camera unavailable"));

    return () => {
      scanner.stop().catch(() => undefined);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-lg font-semibold text-slate-100 print:hidden">Gate Scanner — {GATE_ID}</h1>
        <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-lg print:hidden" />
        {error && <p className="text-sm text-red-400 print:hidden">{error}</p>}
        {lastResult && (
          <div
            className={
              "rounded-lg p-4 text-center font-medium print:hidden " +
              (lastResult.result === "OK"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300")
            }
          >
            <p className="text-lg">{lastResult.result.replace(/_/g, " ")}</p>
            {lastResult.passengerName && <p>{lastResult.passengerName}</p>}
          </div>
        )}
        {lastResult?.result === "OK" && <GateVerificationSlip result={lastResult} gateId={GATE_ID} />}
      </div>
    </DashboardLayout>
  );
}
