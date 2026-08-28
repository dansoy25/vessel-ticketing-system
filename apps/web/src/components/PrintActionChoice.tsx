export default function PrintActionChoice({
  message,
  onPrintCard,
  onPrintReceipt,
  onClose,
}: {
  message: string;
  onPrintCard: () => void;
  onPrintReceipt: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
      <p className="text-sm font-medium text-slate-100">{message}</p>
      <button
        onClick={onPrintCard}
        className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950"
      >
        Print Permanent QR Pass Card
      </button>
      <button
        onClick={onPrintReceipt}
        className="rounded-lg border border-slate-700 px-4 py-3 font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
      >
        Print Payment Receipt
      </button>
      <button onClick={onClose} className="text-xs text-slate-500 underline">
        Skip
      </button>
    </div>
  );
}
