"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Topbar } from "@/components/Topbar";

const TABS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/records", label: "Records" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api
      .get<{ admin: AdminUser }>("/api/admin/auth/me")
      .then((res) => setAdmin(res.admin))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        }
      })
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await api.post("/api/admin/auth/logout").catch(() => {});
    router.replace("/admin/login");
  }

  if (!checked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar />
        <p style={{ padding: 24, color: "var(--ink-faint)" }}>Loading…</p>
      </div>
    );
  }
  if (!admin) return null; // redirecting

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px clamp(16px, 4vw, 40px) 70px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <span className="eyebrow">DISTRICT ADMIN · {admin.name}</span>
            <h1 style={{ fontSize: 26 }}>Attendance dashboard</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line-soft)", marginBottom: 20, overflowX: "auto" }}>
          {TABS.map((tab) => {
            const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: "10px 14px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: active ? "var(--accent)" : "var(--ink-faint)",
                  borderBottom: active ? "2.5px solid var(--accent)" : "2.5px solid transparent",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
