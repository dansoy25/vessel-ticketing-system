"use client";

import dynamic from "next/dynamic";

const GateScanner = dynamic(() => import("@/components/GateScanner"), {
  ssr: false,
});

export default function ScanPage() {
  return <GateScanner />;
}
