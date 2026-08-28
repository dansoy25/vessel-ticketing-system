"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CargoForm from "@/components/CargoForm";
import { fetchCargoEntries, type CargoEntry } from "@/lib/api";

export default function CargoLogPage() {
  const [cargoEntries, setCargoEntries] = useState<CargoEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadCargo() {
    fetchCargoEntries()
      .then(setCargoEntries)
      .catch(() => setLoadError("Could not load cargo entries. Is the API running?"));
  }

  useEffect(loadCargo, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Cargo Log</h1>

        {loadError && <p className="text-sm text-red-400">{loadError}</p>}

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Log New Cargo</h2>
          <CargoForm onCreated={(c) => setCargoEntries((prev) => [c, ...prev])} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-100">Cargo History</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Cargo Type</th>
                  <th className="p-3 font-medium text-right">Weight (kg)</th>
                  <th className="p-3 font-medium">Vehicle Plate</th>
                  <th className="p-3 font-medium text-right">Fee</th>
                </tr>
              </thead>
              <tbody>
                {cargoEntries.map((c) => (
                  <tr key={c.id} className="border-t border-slate-800">
                    <td className="p-3 text-slate-400">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="p-3">{c.cargoType}</td>
                    <td className="p-3 text-right">{c.weight}</td>
                    <td className="p-3">{c.vehiclePlate ?? "—"}</td>
                    <td className="p-3 text-right">₱{c.fee.toFixed(2)}</td>
                  </tr>
                ))}
                {cargoEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-slate-500">
                      No cargo logged yet.
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
