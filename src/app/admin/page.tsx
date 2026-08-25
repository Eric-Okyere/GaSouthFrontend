"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OpenCheckin, TodayStats } from "@/lib/types";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

function Tile({ n, l, href, warn }: { n: string | number; l: string; href?: string; warn?: boolean }) {
  const content = (
    <div className="stat-tile" style={warn && Number(n) > 0 ? { borderColor: "var(--bad)" } : undefined}>
      <div className="n mono" style={warn && Number(n) > 0 ? { color: "var(--bad)" } : undefined}>
        {n}
      </div>
      <div className="l">{l}</div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Link>
  ) : (
    content
  );
}

function TodayTab() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    api
      .get<TodayStats>("/api/admin/stats/today")
      .then(setStats)
      .catch(() => toast("Could not load today's stats.", true));
    api
      .get<{ openCheckins: OpenCheckin[] }>("/api/admin/open-checkins")
      .then((res) => setOpenCount(res.openCheckins.length))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) return <p style={{ color: "var(--ink-faint)" }}>Loading…</p>;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Tile n={stats.checkins} l="Check-ins today" />
        <Tile n={stats.checkouts} l="Check-outs today" />
        <Tile n={`${stats.schoolsReporting} / ${stats.totalSchools}`} l="Schools reporting" />
        <Tile n={openCount ?? "–"} l="Still checked in" href="/admin/alerts" warn />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>School</th>
              <th>In</th>
              <th>Out</th>
            </tr>
          </thead>
          <tbody>
            {stats.perSchool.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">
                  No schools yet.
                </td>
              </tr>
            )}
            {stats.perSchool.map((s) => (
              <tr key={s.schoolId}>
                <td>{s.name}</td>
                <td className="mono">{s.in}</td>
                <td className="mono">{s.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminTodayPage() {
  return (
    <AdminShell>
      <TodayTab />
    </AdminShell>
  );
}
