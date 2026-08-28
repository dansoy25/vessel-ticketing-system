"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  calculateFare,
  discountRateForCategory,
  ID_PROOF_REQUIRED_CATEGORIES,
  type FareConfig,
  type PassengerCategory,
  type PaymentMethod,
} from "@vessel/shared";
import {
  fetchFareSettings,
  registerPassenger,
  topUpPassenger,
  type Passenger,
} from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { PaymentReceiptData } from "@/components/PaymentReceiptDocument";

const CATEGORY_LABELS: Record<PassengerCategory, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child Under 7",
};

const CATEGORIES: PassengerCategory[] = ["REGULAR", "STUDENT", "PWD", "SENIOR", "CHILD_UNDER_7"];

const ID_FIELD_LABELS: Partial<Record<PassengerCategory, string>> = {
  STUDENT: "Student ID Number",
  PWD: "Government ID Number",
  SENIOR: "Government ID Number",
};

export type RegistrationTab = "new" | "topup";

export default function PassengerRegistrationCard({
  tab,
  onTabChange,
  topUpTarget,
  onClearTopUpTarget,
  onRegistered,
  onToppedUp,
}: {
  tab: RegistrationTab;
  onTabChange: (tab: RegistrationTab) => void;
  topUpTarget: Passenger | null;
  onClearTopUpTarget: () => void;
  onRegistered: (passenger: Passenger, receipt: PaymentReceiptData) => void;
  onToppedUp: (passenger: Passenger, receipt: PaymentReceiptData) => void;
}) {
  const [fareConfig, setFareConfig] = useState<FareConfig | null>(null);

  useEffect(() => {
    fetchFareSettings().then(setFareConfig).catch(() => undefined);
  }, []);

  return (
    <div id="registration" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-950 p-1">
        <TabButton active={tab === "new"} onClick={() => onTabChange("new")}>
          New Passenger Registration
        </TabButton>
        <TabButton active={tab === "topup"} onClick={() => onTabChange("topup")}>
          Top-Up Existing Pass
        </TabButton>
      </div>
      {!fareConfig ? (
        <p className="text-sm text-slate-500">Loading fare rules...</p>
      ) : tab === "new" ? (
        <RegistrationForm fareConfig={fareConfig} onRegistered={onRegistered} />
      ) : (
        <TopUpForm
          fareConfig={fareConfig}
          target={topUpTarget}
          onClear={onClearTopUpTarget}
          onToppedUp={onToppedUp}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
        (active ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-slate-100")
      }
    >
      {children}
    </button>
  );
}

function FareBreakdown({
  fareConfig,
  category,
  rides,
}: {
  fareConfig: FareConfig;
  category: PassengerCategory;
  rides: number;
}) {
  const { baseFare, discountRate, discountAmount, totalFee } = calculateFare(
    fareConfig,
    category,
    rides || 0,
  );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
      <span className="text-slate-500">Base Fare</span>
      <span className="text-right">₱{baseFare.toFixed(2)}</span>
      <span className="text-slate-500">Discount Applied</span>
      <span className="text-right">
        {(discountRate * 100).toFixed(0)}% (−₱{discountAmount.toFixed(2)})
      </span>
      <span className="text-slate-500">Rides Count</span>
      <span className="text-right">{rides || 0}</span>
      <span className="font-semibold text-slate-200">Total Fee</span>
      <span className="text-right font-semibold text-cyan-300">₱{totalFee.toFixed(2)}</span>
    </div>
  );
}

/** Lifts payment-method state + the fields each method requires into one place
 * so Registration and Top-Up can both drive the same validation/reset logic. */
function usePaymentFields(totalFee: number) {
  const [method, setMethodRaw] = useState<PaymentMethod>("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [amountTendered, setAmountTendered] = useState("");

  function setMethod(next: PaymentMethod) {
    setMethodRaw(next);
    setPaymentRef("");
    setAmountTendered("");
  }

  function reset() {
    setMethodRaw("CASH");
    setPaymentRef("");
    setAmountTendered("");
  }

  const tendered = Number(amountTendered) || 0;
  const changeDue = tendered - totalFee;
  const isValid =
    method === "CASH" ? amountTendered !== "" && changeDue >= 0 : paymentRef.trim().length > 0;

  return {
    method,
    setMethod,
    paymentRef,
    setPaymentRef,
    amountTendered,
    setAmountTendered,
    changeDue,
    isValid,
    reset,
  };
}

type PaymentFieldsState = ReturnType<typeof usePaymentFields>;

function PaymentFields({ payment }: { payment: PaymentFieldsState }) {
  const { method, setMethod, paymentRef, setPaymentRef, amountTendered, setAmountTendered, changeDue } =
    payment;

  return (
    <div className="flex flex-col gap-3">
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      >
        <option value="CASH">Cash</option>
        <option value="GCASH">GCash</option>
        <option value="CARD">Card</option>
      </select>

      {method === "GCASH" && (
        <input
          required
          placeholder="GCash Reference Number"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 p-3"
        />
      )}

      {method === "CARD" && (
        <input
          required
          placeholder="Card Transaction Ref / Terminal No."
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 p-3"
        />
      )}

      {method === "CASH" && (
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount Tendered (₱)"
            value={amountTendered}
            onChange={(e) => setAmountTendered(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-3"
          />
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
            <p className="text-slate-500">Change Due</p>
            <p className={"font-semibold " + (changeDue < 0 ? "text-red-400" : "text-emerald-300")}>
              ₱{changeDue.toFixed(2)}
            </p>
            {amountTendered !== "" && changeDue < 0 && (
              <p className="text-xs text-red-400">Insufficient amount</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationForm({
  fareConfig,
  onRegistered,
}: {
  fareConfig: FareConfig;
  onRegistered: (passenger: Passenger, receipt: PaymentReceiptData) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiry, setIdExpiry] = useState("");
  const [category, setCategory] = useState<PassengerCategory>("REGULAR");
  const [ridesPurchased, setRidesPurchased] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rides = Number(ridesPurchased) || 0;
  const idRequired = ID_PROOF_REQUIRED_CATEGORIES.includes(category);
  const { totalFee } = calculateFare(fareConfig, category, rides || 0);
  const payment = usePaymentFields(totalFee);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const passenger = await registerPassenger({
        fullName,
        category,
        phone: phone || undefined,
        idNumber: idNumber || undefined,
        idExpiry: idExpiry || undefined,
        ridesPurchased: rides,
        paymentMethod: payment.method,
        paymentRef: payment.method === "CASH" ? undefined : payment.paymentRef,
      });
      const { baseFare, discountRate, discountAmount, totalFee } = calculateFare(
        fareConfig,
        category,
        rides,
      );
      const receipt: PaymentReceiptData = {
        passengerName: passenger.fullName,
        category: passenger.category,
        ridesPurchased: rides,
        baseFare,
        discountRate,
        discountAmount,
        totalFee,
        remainingRidesBalance: passenger.remainingRides,
        paymentMethod: payment.method,
        paymentRef: payment.method === "CASH" ? undefined : payment.paymentRef,
        amountTendered: payment.method === "CASH" ? Number(payment.amountTendered) || 0 : undefined,
        changeDue: payment.method === "CASH" ? payment.changeDue : undefined,
        issuedBy: getStoredUser()?.username ?? "Unknown",
        timestamp: new Date().toISOString(),
      };
      setStatus(`Registered. QR pass issued with ${passenger.totalRides} rides.`);
      setFullName("");
      setPhone("");
      setIdNumber("");
      setIdExpiry("");
      setCategory("REGULAR");
      setRidesPurchased("1");
      payment.reset();
      onRegistered(passenger, receipt);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        placeholder="Passenger full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <input
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <select
        value={category}
        onChange={(e) => {
          const next = e.target.value as PassengerCategory;
          setCategory(next);
          if (!ID_PROOF_REQUIRED_CATEGORIES.includes(next)) {
            setIdNumber("");
            setIdExpiry("");
          }
        }}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]} ({(discountRateForCategory(fareConfig, c) * 100).toFixed(0)}% off)
          </option>
        ))}
      </select>

      {idRequired ? (
        <>
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            {ID_FIELD_LABELS[category]} (required)
            <input
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            ID Expiry Date (required)
            <input
              required
              type="date"
              value={idExpiry}
              onChange={(e) => setIdExpiry(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
            />
          </label>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-500">
          No ID Required
        </p>
      )}

      <input
        required
        type="number"
        min={1}
        placeholder="Rides to purchase"
        value={ridesPurchased}
        onChange={(e) => setRidesPurchased(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <FareBreakdown fareConfig={fareConfig} category={category} rides={rides} />
      <PaymentFields payment={payment} />
      <button
        type="submit"
        disabled={submitting || !payment.isValid}
        className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Register & Generate QR Pass"}
      </button>
      {status && <p className="text-sm text-slate-400">{status}</p>}
    </form>
  );
}

function TopUpForm({
  fareConfig,
  target,
  onClear,
  onToppedUp,
}: {
  fareConfig: FareConfig;
  target: Passenger | null;
  onClear: () => void;
  onToppedUp: (passenger: Passenger, receipt: PaymentReceiptData) => void;
}) {
  const [ridesPurchased, setRidesPurchased] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rides = Number(ridesPurchased) || 0;
  const { totalFee } = calculateFare(fareConfig, target?.category ?? "REGULAR", rides || 0);
  const payment = usePaymentFields(totalFee);

  if (!target) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
        Select a passenger from the list and click &ldquo;Reload Pass&rdquo; to top up their rides.
      </p>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const updated = await topUpPassenger(target.id, {
        ridesPurchased: rides,
        paymentMethod: payment.method,
        paymentRef: payment.method === "CASH" ? undefined : payment.paymentRef,
      });
      const { baseFare, discountRate, discountAmount, totalFee } = calculateFare(
        fareConfig,
        target.category,
        rides,
      );
      const receipt: PaymentReceiptData = {
        passengerName: updated.fullName,
        category: updated.category,
        ridesPurchased: rides,
        baseFare,
        discountRate,
        discountAmount,
        totalFee,
        remainingRidesBalance: updated.remainingRides,
        paymentMethod: payment.method,
        paymentRef: payment.method === "CASH" ? undefined : payment.paymentRef,
        amountTendered: payment.method === "CASH" ? Number(payment.amountTendered) || 0 : undefined,
        changeDue: payment.method === "CASH" ? payment.changeDue : undefined,
        issuedBy: getStoredUser()?.username ?? "Unknown",
        timestamp: new Date().toISOString(),
      };
      setStatus(`Added ${rides} rides. New balance: ${updated.remainingRides}.`);
      setRidesPurchased("1");
      payment.reset();
      onToppedUp(updated, receipt);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
        <div>
          <p className="font-medium text-slate-100">{target.fullName}</p>
          <p className="text-slate-500">
            {target.remainingRides} rides remaining · Pass ID {target.qrToken.slice(0, 8)}…
          </p>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-slate-400 underline">
          Change
        </button>
      </div>
      <input
        required
        type="number"
        min={1}
        placeholder="Rides to add"
        value={ridesPurchased}
        onChange={(e) => setRidesPurchased(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <FareBreakdown fareConfig={fareConfig} category={target.category} rides={rides} />
      <PaymentFields payment={payment} />
      <button
        type="submit"
        disabled={submitting || !payment.isValid}
        className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Add rides (same QR pass)"}
      </button>
      {status && <p className="text-sm text-slate-400">{status}</p>}
    </form>
  );
}
