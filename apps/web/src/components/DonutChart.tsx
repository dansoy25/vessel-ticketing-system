export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export default function DonutChart({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90 shrink-0">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" className="text-slate-800" strokeWidth={20} />
        {total > 0 &&
          data
            .filter((d) => d.value > 0)
            .map((d) => {
              const dash = (d.value / total) * circumference;
              const el = (
                <circle
                  key={d.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={20}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return el;
            })}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-slate-300">{d.label}</span>
            <span className="text-slate-500">
              {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </li>
        ))}
        {total === 0 && <li className="text-slate-500">No passengers registered yet.</li>}
      </ul>
    </div>
  );
}
