"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

export function Topbar() {
  // Purely a visual hint ("is an admin currently signed in on this device"),
  // not a security check — the real gate is the server-side proxy redirect
  // on /admin/* plus AdminShell's own check. A 401 here just means signed
  // out, so it's swallowed rather than surfaced as an error.
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    api
      .get<{ admin: AdminUser }>("/api/admin/auth/me")
      .then((res) => setAdmin(res.admin))
      .catch(() => {});
  }, []);

  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px clamp(16px, 4vw, 40px)",
        borderBottom: "1px solid var(--line-soft)",
        background: "var(--surface)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 9, textDecoration: "none", color: "var(--ink)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-ink)",
            fontSize: 15,
            flex: "none",
          }}
        >
          🏫
        </span>
        <span>
          <span style={{ fontFamily: "var(--font-display-stack)", fontWeight: 600, fontSize: 18 }}>Ga South Attendance</span>
          <br />
          <span className="eyebrow">TEACHER CHECK-IN / CHECK-OUT</span>
        </span>
      </Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link
          href="/register"
          style={{ fontSize: 13.5, color: "var(--ink-soft)", textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}
        >
          Register
        </Link>
        <Link
          href="/admin"
          title={admin ? `Signed in as ${admin.name}` : "Sign in to the admin dashboard"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13.5,
            fontWeight: admin ? 600 : 400,
            color: admin ? "var(--good)" : "var(--ink-soft)",
            textDecoration: "none",
            padding: "8px 10px",
            borderRadius: 8,
            background: admin ? "var(--good-bg)" : "transparent",
          }}
        >
          {admin && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--good)", flex: "none" }} />}
          {admin ? `Admin · ${admin.name}` : "Admin"}
        </Link>
      </nav>
    </div>
  );
}
