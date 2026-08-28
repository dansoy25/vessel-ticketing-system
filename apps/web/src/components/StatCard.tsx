export type StatTone = "green" | "lightGreen" | "orange" | "darkRed";

const TONE_CLASSES: Record<StatTone, string> = {
  green: "border-emerald-700/50 bg-emerald-950/40 text-emerald-300",
  lightGreen: "border-lime-700/50 bg-lime-950/30 text-lime-300",
  orange: "border-orange-700/50 bg-orange-950/40 text-orange-300",
  darkRed: "border-red-800/60 bg-red-950/50 text-red-300",
};

export default function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatTone;
}) {
  return (
    <div className={"rounded-xl border p-4 " + TONE_CLASSES[tone]}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
