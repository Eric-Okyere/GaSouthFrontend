"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TodayStats } from "@/lib/types";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

function Tile({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="stat-tile">
      <div className="n mono">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function TodayTab() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const toast = useToast();

  useEffect(() => {
    api
      .get<TodayStats>("/api/admin/stats/today")
      .then(setStats)
      .catch(() => toast("Could not load today's stats.", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) return <p style={{ color: "var(--ink-faint)" }}>Loading…</p>;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Tile n={stats.checkins} l="Check-ins today" />
        <Tile n={stats.checkouts} l="Check-outs today" />
        <Tile n={`${stats.schoolsReporting} / ${stats.totalSchools}`} l="Schools reporting" />
        <Tile n={stats.flagged} l="Flagged entries" />
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
