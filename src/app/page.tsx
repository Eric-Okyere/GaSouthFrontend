"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { School } from "@/lib/types";
import { Topbar } from "@/components/Topbar";
import { QrCode } from "@/components/QrCode";
import { useToast } from "@/components/Toast";
import { useRequireAdmin } from "@/lib/useRequireAdmin";

export default function DirectoryPage() {
  const { admin, checked } = useRequireAdmin();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("");
  const toast = useToast();

  useEffect(() => {
    // Server and the first client render both have no `window`, so origin
    // starts empty (QrCode/copy-link stay hidden) and is filled in right
    // after hydration — deliberately deferred a tick to keep server and
    // client markup identical on the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    api
      .get<School[]>("/api/schools")
      .then(setSchools)
      .catch(() => toast("Could not load the school list.", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!schools) return [];
    const q = query.trim().toLowerCase();
    return schools
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, query]);

  function checkinUrl(id: string) {
    return `${origin}/checkin/${id}`;
  }

  async function copyLink(id: string) {
    try {
      await navigator.clipboard.writeText(checkinUrl(id));
      toast("Link copied.");
    } catch {
      toast("Could not copy — long-press the link instead.", true);
    }
  }

  // This page is district-admin-only (see proxy.ts) — the cookie-presence
  // redirect there is the fast path; this is the real check, confirming the
  // session actually still works before showing anything.
  if (!checked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar />
        <p style={{ padding: 24, color: "var(--ink-faint)" }}>Loading…</p>
      </div>
    );
  }
  if (!admin) return null; // redirecting to /admin/login

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />

      <div style={{ padding: "clamp(28px, 6vw, 52px) clamp(16px, 4vw, 40px) 20px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        <span className="eyebrow">GA SOUTH MUNICIPAL / DISTRICT · GHANA EDUCATION SERVICE</span>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 6 }}>Every school, one scan.</h1>
        <p style={{ color: "var(--ink-soft)", maxWidth: "60ch", marginTop: 10, fontSize: 15.5 }}>
          Each school below has its own QR code. Post it at the staff entrance — teachers scan it each morning and
          afternoon to check in and check out. No app to install.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <div className="stat-tile">
            <div className="n mono">{schools ? schools.length : "–"}</div>
            <div className="l">Schools</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            marginTop: 22,
            padding: "18px 20px",
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            background: "var(--surface-2)",
          }}
        >
          {origin && (
            <div className="qr-wrap no-print" style={{ width: 64, height: 64, flex: "none", border: "1px solid var(--line-soft)" }}>
              <QrCode value={`${origin}/register`} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>New teacher? Register your details</div>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 3 }}>
              One form, any school — scan the code or use the link, once.
            </p>
          </div>
          <Link className="btn btn-primary btn-sm no-print" href="/register">
            Open registration form
          </Link>
        </div>
      </div>

      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1080,
          margin: "8px auto 0",
          padding: "0 clamp(16px, 4vw, 40px)",
        }}
      >
        <input
          type="search"
          placeholder="Find a school…"
          aria-label="Find a school"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            minWidth: 220,
            maxWidth: 360,
            width: "100%",
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid var(--line)",
            background: "var(--surface)",
            minHeight: 44,
          }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          🖨 Print all QR codes
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
          maxWidth: 1080,
          margin: "18px auto 60px",
          padding: "0 clamp(16px, 4vw, 40px)",
          width: "100%",
        }}
      >
        {!schools && <p style={{ color: "var(--ink-faint)" }}>Loading…</p>}
        {schools && filtered.length === 0 && <div className="empty-state">No schools match “{query}”.</div>}
        {filtered.map((s) => (
          <div key={s.id} className="card print-page" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="qr-wrap" style={{ width: 88, height: 88, border: "1px solid var(--line-soft)" }}>
              {origin && <QrCode value={checkinUrl(s.id)} />}
            </div>
            <h3 style={{ fontSize: 16, lineHeight: 1.3 }}>{s.name}</h3>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              {s.hasAnchor ? "📍 anchored" : "no GPS anchor"}
            </div>
            <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
              <Link className="btn btn-primary btn-sm" href={`/checkin/${s.id}`}>
                Open check-in
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={() => copyLink(s.id)}>
                Copy link
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="no-print" style={{ padding: "26px clamp(16px, 4vw, 40px) 40px", textAlign: "center" }}>
        <Link href="/admin" style={{ color: "var(--ink-faint)", fontSize: 12, textDecoration: "none" }}>
          District admin dashboard →
        </Link>
      </footer>
    </div>
  );
}
