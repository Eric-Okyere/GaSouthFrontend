"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { School } from "@/lib/types";
import { Topbar } from "@/components/Topbar";
import { QrCode } from "@/components/QrCode";

type Loaded = { school: School; origin: string } | "notfound" | "loading";

export default function PrintSchoolQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<Loaded>("loading");

  useEffect(() => {
    const origin = window.location.origin;
    api
      .get<School>(`/api/admin/schools/${id}`)
      .then((school) => {
        setState({ school, origin });
        // Give the QR svg a moment to render before the print dialog opens.
        if (school.anchorLat != null) setTimeout(() => window.print(), 400);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/admin/login?next=${encodeURIComponent(`/admin/schools/${id}/print`)}`);
        } else {
          setState("notfound");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />
      <div className="no-print" style={{ padding: "0 clamp(16px, 4vw, 40px)", marginTop: 16 }}>
        <Link href="/admin/schools" style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          ← Back to Schools
        </Link>
      </div>

      {state === "loading" && <p style={{ padding: 24, color: "var(--ink-faint)" }}>Loading…</p>}

      {state === "notfound" && (
        <div style={{ padding: 24, maxWidth: 420 }}>
          <div className="error-box">Could not load this school.</div>
        </div>
      )}

      {typeof state === "object" && state.school.anchorLat == null && (
        <div style={{ padding: 24, maxWidth: 420 }}>
          <div className="error-box">
            {state.school.name} doesn&apos;t have a GPS anchor yet. Capture one from the Schools tab before printing its QR code, so
            check-ins can be verified against a real location.
          </div>
        </div>
      )}

      {typeof state === "object" && state.school.anchorLat != null && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="print-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: 32, textAlign: "center" }}>
            <div className="qr-wrap" style={{ width: 320, height: 320, padding: 20, border: "1px solid var(--line-soft)" }}>
              <QrCode value={`${state.origin}/checkin/${state.school.code || state.school.id}`} />
            </div>
            <h2 style={{ fontSize: 22 }}>{state.school.name}</h2>
            <p style={{ color: "var(--ink-faint)", fontSize: 13 }}>Scan to check in / check out · Ga South Teacher Attendance</p>
            <div style={{ maxWidth: 320 }}>
              <p style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>Phone can&apos;t scan? Open this link instead:</p>
              <a
                href={`${state.origin}/checkin/${state.school.code || state.school.id}`}
                className="mono"
                style={{ fontSize: 14, color: "var(--accent)", wordBreak: "break-all", display: "inline-block", marginTop: 4 }}
              >
                {`${state.origin}/checkin/${state.school.code || state.school.id}`.replace(/^https?:\/\//, "")}
              </a>
            </div>
            <button className="btn btn-primary no-print" onClick={() => window.print()}>
              🖨 Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
