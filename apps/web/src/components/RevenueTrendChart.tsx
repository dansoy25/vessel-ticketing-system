export interface TrendPoint {
  label: string;
  revenue: number;
  expenses: number;
}

export default function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  const width = 600;
  const height = 200;
  const paddingLeft = 8;
  const paddingBottom = 20;
  const paddingTop = 8;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(1, ...data.flatMap((d) => [d.revenue, d.expenses]));

  function x(i: number) {
    return paddingLeft + (data.length <= 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
  }
  function y(v: number) {
    return paddingTop + plotHeight - (v / maxValue) * plotHeight;
  }

  function pathFor(key: "revenue" | "expenses") {
    return data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Expenses
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-slate-800">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={paddingLeft}
            x2={width - 8}
            y1={paddingTop + plotHeight * (1 - t)}
            y2={paddingTop + plotHeight * (1 - t)}
            stroke="currentColor"
          />
        ))}
        {data.length > 0 && (
          <>
            <path d={pathFor("revenue")} fill="none" stroke="#34d399" strokeWidth={2} />
            <path d={pathFor("expenses")} fill="none" stroke="#f87171" strokeWidth={2} />
          </>
        )}
        {data.map((d, i) => (
          <text
            key={d.label}
            x={x(i)}
            y={height - 4}
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontSize: 9 }}
          >
            {d.label}
          </text>
        ))}
      </svg>
      {data.length === 0 && <p className="text-sm text-slate-500">No revenue or expense data yet.</p>}
    </div>
  );
}
