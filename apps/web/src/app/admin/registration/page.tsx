"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PassengerRegistrationCard, {
  type RegistrationTab,
} from "@/components/PassengerRegistrationCard";
import PassengerTable from "@/components/PassengerTable";
import PassIdCard from "@/components/PassIdCard";
import PaymentReceiptDocument, {
  type PaymentReceiptData,
} from "@/components/PaymentReceiptDocument";
import PrintActionChoice from "@/components/PrintActionChoice";
import { fetchPassengerDetail, fetchPassengers, type Passenger } from "@/lib/api";

type DocumentView =
  | { type: "choice"; passenger: Passenger; receipt: PaymentReceiptData }
  | { type: "idCard"; passenger: Passenger }
  | { type: "receipt"; receipt: PaymentReceiptData };

function RegistrationPageContent() {
  const searchParams = useSearchParams();
  const initialTab: RegistrationTab = searchParams.get("tab") === "topup" ? "topup" : "new";

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [registrationTab, setRegistrationTab] = useState<RegistrationTab>(initialTab);
  const [topUpTarget, setTopUpTarget] = useState<Passenger | null>(null);
  const [documentView, setDocumentView] = useState<DocumentView | null>(null);

  function loadPassengers() {
    fetchPassengers()
      .then(setPassengers)
      .catch(() => setLoadError("Could not load pass holders. Is the API running?"));
  }

  useEffect(loadPassengers, []);

  async function reprintReceipt(passenger: Passenger) {
    setLoadError(null);
    try {
      const detail = await fetchPassengerDetail(passenger.id);
      const latest = detail.paymentLogs[0];
      if (!latest) {
        setLoadError(`No payment history found for ${passenger.fullName}.`);
        return;
      }
      const receipt: PaymentReceiptData = {
        passengerName: detail.fullName,
        category: detail.category,
        ridesPurchased: latest.ridesAdded,
        baseFare: latest.baseFare,
        discountRate: latest.discountRate,
        discountAmount: latest.discountAmount,
        totalFee: latest.amount,
        remainingRidesBalance: detail.remainingRides,
        paymentMethod: (latest.paymentMethod as PaymentReceiptData["paymentMethod"]) ?? "CASH",
        paymentRef: latest.paymentRef,
        issuedBy: latest.operatorName,
        timestamp: latest.createdAt,
      };
      setDocumentView({ type: "receipt", receipt });
    } catch {
      setLoadError(`Could not load receipt history for ${passenger.fullName}.`);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Pass Registration</h1>

        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        {documentView ? (
          documentView.type === "choice" ? (
            <PrintActionChoice
              message="Transaction complete. What would you like to print?"
              onPrintCard={() => setDocumentView({ type: "idCard", passenger: documentView.passenger })}
              onPrintReceipt={() => setDocumentView({ type: "receipt", receipt: documentView.receipt })}
              onClose={() => setDocumentView(null)}
            />
          ) : documentView.type === "idCard" ? (
            <PassIdCard passenger={documentView.passenger} onClose={() => setDocumentView(null)} />
          ) : (
            <PaymentReceiptDocument
              receipt={documentView.receipt}
              onClose={() => setDocumentView(null)}
            />
          )
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <PassengerRegistrationCard
              tab={registrationTab}
              onTabChange={setRegistrationTab}
              topUpTarget={topUpTarget}
              onClearTopUpTarget={() => setTopUpTarget(null)}
              onRegistered={(p, receipt) => {
                setPassengers((prev) => [p, ...prev]);
                setDocumentView({ type: "choice", passenger: p, receipt });
              }}
              onToppedUp={(p, receipt) => {
                setPassengers((prev) => prev.map((x) => (x.id === p.id ? p : x)));
                setTopUpTarget(p);
                setDocumentView({ type: "choice", passenger: p, receipt });
              }}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-100">Active Pass Holders</h2>
              <PassengerTable
                passengers={passengers}
                onReload={(p) => {
                  setTopUpTarget(p);
                  setRegistrationTab("topup");
                }}
                onPrintPassId={(p) => setDocumentView({ type: "idCard", passenger: p })}
                onPrintReceipt={reprintReceipt}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationPageContent />
    </Suspense>
  );
}
