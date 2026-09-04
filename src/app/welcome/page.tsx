"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/Topbar";

function WelcomeContent() {
  const params = useSearchParams();
  const name = params.get("name")?.trim() || "";
  const school = params.get("school")?.trim() || "";
  const code = params.get("code")?.trim() || "";
  const updated = params.get("updated") === "true";

  const firstName = name.split(" ")[0] || "";
  const checkinHref = code ? `/checkin/${code}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 18px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 460, padding: "clamp(22px, 5vw, 34px)", textAlign: "center" }}>
          {name ? (
            <>
              <div className="status-pill in" style={{ display: "inline-flex" }}>
                <span className="dot" />
                {updated ? "Details updated" : "Registered"}
              </div>
              <h2 style={{ fontSize: 24, marginTop: 16 }}>Welcome, {firstName}!</h2>
              <p style={{ color: "var(--ink-soft)", fontSize: 14.5, marginTop: 8 }}>
                {updated ? "Your details at " : "You're on record at "}
                {school ? <strong>{school}</strong> : "your school"} {updated ? "have been updated" : "have been saved"}.
                Use your school&apos;s QR code (or the link below) to check in and out every school day.
              </p>

              {checkinHref ? (
                <Link className="btn btn-primary btn-block btn-lg" style={{ marginTop: 22 }} href={checkinHref}>
                  Go to my check-in page
                </Link>
              ) : (
                <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-faint)" }}>
                  Ask your school admin for your school&apos;s QR code to check in.
                </p>
              )}
              <Link className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href="/register">
                Register another teacher
              </Link>
            </>
          ) : (
            <>
              <span className="eyebrow">GA SOUTH MUNICIPAL / DISTRICT · GHANA EDUCATION SERVICE</span>
              <h2 style={{ fontSize: 24, marginTop: 10 }}>Welcome to Ga South Attendance</h2>
              <p style={{ color: "var(--ink-soft)", fontSize: 14.5, marginTop: 8 }}>
                Teachers register once, then check in and out each school day by scanning the QR code posted at their
                school. If you haven&apos;t registered yet, start there.
              </p>
              <Link className="btn btn-primary btn-block btn-lg" style={{ marginTop: 22 }} href="/register">
                Register now
              </Link>
              <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-faint)" }}>
                Already registered? Use the QR code at your school&apos;s staff entrance to check in.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--ink-faint)" }}>Loading…</p>}>
      <WelcomeContent />
    </Suspense>
  );
}
