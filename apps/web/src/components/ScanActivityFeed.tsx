const CATEGORY_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  STUDENT: "Student",
  PWD: "PWD",
  SENIOR: "Senior Citizen",
  CHILD_UNDER_7: "Child (Under 7)",
};

export interface ScanFeedItem {
  id: string;
  passengerName: string;
  category: string;
  remainingRides: number;
  scannedAt: string;
}

export default function ScanActivityFeed({ items }: { items: ScanFeedItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-900 text-slate-400">
          <tr>
            <th className="p-3 font-medium">Passenger</th>
            <th className="p-3 font-medium">Category</th>
            <th className="p-3 font-medium">Scan Time</th>
            <th className="p-3 font-medium text-right">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-slate-800">
              <td className="p-3">{item.passengerName}</td>
              <td className="p-3">{CATEGORY_LABELS[item.category] ?? item.category}</td>
              <td className="p-3 text-slate-400">{new Date(item.scannedAt).toLocaleTimeString()}</td>
              <td className="p-3 text-right">{item.remainingRides}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="p-3 text-slate-500">
                No gate scans yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
