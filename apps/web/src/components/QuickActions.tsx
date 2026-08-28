import Link from "next/link";

const ACTIONS = [
  { label: "Register", href: "/admin/registration" },
  { label: "Reload", href: "/admin/registration?tab=topup" },
  { label: "Log Cargo", href: "/admin/cargo" },
  { label: "Print Receipts", href: "/admin/registration" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-center text-sm font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}
