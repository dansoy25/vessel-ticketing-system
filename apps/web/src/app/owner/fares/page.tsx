"use client";

import DashboardLayout from "@/components/DashboardLayout";
import FareSettingsCard from "@/components/FareSettingsCard";

export default function FareSettingsPage() {
  return (
    <DashboardLayout requireRole="OWNER">
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-slate-100">Fare Settings</h1>
        <FareSettingsCard />
      </div>
    </DashboardLayout>
  );
}
