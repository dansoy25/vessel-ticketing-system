"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { FareConfig } from "@vessel/shared";
import { fetchFareSettings, updateFareSettings } from "@/lib/api";

export default function FareSettingsCard() {
  const [fare, setFare] = useState<FareConfig | null>(null);
  const [baseFarePerRide, setBaseFarePerRide] = useState("");
  const [studentPercent, setStudentPercent] = useState("");
  const [pwdPercent, setPwdPercent] = useState("");
  const [seniorPercent, setSeniorPercent] = useState("");
  const [childPercent, setChildPercent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFareSettings()
      .then((f) => {
        setFare(f);
        setBaseFarePerRide(String(f.baseFarePerRide));
        setStudentPercent(String(f.studentDiscount * 100));
        setPwdPercent(String(f.pwdDiscount * 100));
        setSeniorPercent(String(f.seniorDiscount * 100));
        setChildPercent(String(f.childDiscount * 100));
      })
      .catch(() => setStatus("Could not load fare settings."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateFareSettings({
        baseFarePerRide: Number(baseFarePerRide),
        studentDiscountPercent: Number(studentPercent),
        pwdDiscountPercent: Number(pwdPercent),
        seniorDiscountPercent: Number(seniorPercent),
        childDiscountPercent: Number(childPercent),
      });
      setFare(updated);
      setStatus("Fare rules updated. New rates apply immediately to registrations and top-ups.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save fare settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="fare-settings" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-1 text-base font-semibold text-slate-100">Fare &amp; Discount Management</h2>
      <p className="mb-4 text-sm text-slate-500">
        Owner-only. Changes apply to every registration and top-up system-wide, instantly.
      </p>
      {!fare ? (
        <p className="text-sm text-slate-500">{status ?? "Loading current rates..."}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Base Fare Per Ride (₱)"
            value={baseFarePerRide}
            onChange={setBaseFarePerRide}
            min={1}
          />
          <Field label="Student Discount %" value={studentPercent} onChange={setStudentPercent} />
          <Field label="PWD Discount %" value={pwdPercent} onChange={setPwdPercent} />
          <Field label="Senior Discount %" value={seniorPercent} onChange={setSeniorPercent} />
          <Field label="Child Under 7 Discount %" value={childPercent} onChange={setChildPercent} />
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Fare Rules"}
            </button>
          </div>
        </form>
      )}
      {status && <p className="mt-3 text-sm text-slate-400">{status}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-400">
      {label}
      <input
        required
        type="number"
        min={min}
        max={label.includes("%") ? 100 : undefined}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
      />
    </label>
  );
}
