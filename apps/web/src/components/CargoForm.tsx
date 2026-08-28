"use client";

import { useState, type FormEvent } from "react";
import { createCargoEntry, type CargoEntry } from "@/lib/api";

export default function CargoForm({ onCreated }: { onCreated: (entry: CargoEntry) => void }) {
  const [cargoType, setCargoType] = useState("");
  const [weight, setWeight] = useState("");
  const [fee, setFee] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const entry = await createCargoEntry({
        cargoType,
        weight: Number(weight),
        fee: Number(fee),
        vehiclePlate: vehiclePlate || undefined,
      });
      setStatus("Cargo entry saved.");
      setCargoType("");
      setWeight("");
      setFee("");
      setVehiclePlate("");
      onCreated(entry);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Cargo entry failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        placeholder="Cargo type"
        value={cargoType}
        onChange={(e) => setCargoType(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <input
        required
        type="number"
        min={0}
        step="0.01"
        placeholder="Weight (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <input
        required
        type="number"
        min={0}
        step="0.01"
        placeholder="Fee (₱)"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <input
        placeholder="Vehicle plate (optional)"
        value={vehiclePlate}
        onChange={(e) => setVehiclePlate(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 p-3"
      />
      <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950">
        Log cargo
      </button>
      {status && <p className="text-sm text-slate-400">{status}</p>}
    </form>
  );
}
