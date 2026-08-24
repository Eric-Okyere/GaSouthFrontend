"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, className }: { value: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: "svg", margin: 1 }, (err, result) => {
      if (!cancelled && !err) setSvg(result);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div
      className={className}
      style={{ background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      aria-label="QR code"
    />
  );
}
