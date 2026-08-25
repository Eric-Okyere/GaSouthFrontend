"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { AttendanceSummaryResponse, SchoolTotals } from "@/lib/types";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";
import { ContactButtons } from "@/components/ContactButtons";

function startOfMonthStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7) + "-01";
}
function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function SchoolSummaryTab({ schoolId }: { schoolId: string }) {
  const [totals, setTotals] = useState<SchoolTotals | null>(null);
  const [start, setStart] = useState(startOfMonthStr());
  const [end, setEnd] = useState(todayStr());
  const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    api
      .get<SchoolTotals>(`/api/admin/schools/${schoolId}/totals`)
      .then(setTotals)
      .catch(() => toast("Could not load totals.", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  function loadSummary() {
    api
      .get<AttendanceSummaryResponse>(`/api/admin/schools/${schoolId}/attendance-summary?start=${start}&end=${end}`)
      .then((res) => {
        setSummary(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load the attendance summary."));
  }
  useEffect(loadSummary, [schoolId, start, end]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="stat-tile">
          <div className="n mono">{totals ? totals.checkins : "–"}</div>
          <div className="l">Total check-ins (all time)</div>
        </div>
        <div className="stat-tile">
          <div className="n mono">{totals ? totals.checkouts : "–"}</div>
          <div className="l">Total check-outs (all time)</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ fontSize: 17 }}>Present / absent by teacher</h2>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
          From
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={{ border: "1.5px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: "7px 9px", fontSize: 13.5 }} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
          To
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={{ border: "1.5px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: "7px 9px", fontSize: 13.5 }} />
        </label>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 12 }}>
        Weekends aren&apos;t counted as school days. A teacher added partway through the range only counts from the day they joined.
      </p>

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Staff ID</th>
              <th>Present</th>
              <th>Absent</th>
              <th>School days</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {summary && summary.teachers.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No active roster entries for this school yet.
                </td>
              </tr>
            )}
            {summary?.teachers.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="mono">{t.staffId}</td>
                <td>
                  <span className="badge in">{t.presentDays}</span>
                </td>
                <td>
                  <span className={`badge ${t.absentDays > 0 ? "flag" : "muted"}`}>{t.absentDays}</span>
                </td>
                <td className="mono">{t.totalSchoolDays}</td>
                <td>
                  <ContactButtons phone={t.phoneNumber} />
                </td>
                <td>
                  <Link className="btn btn-ghost btn-sm" href={`/admin/records?school=${schoolId}&staffId=${encodeURIComponent(t.staffId)}`}>
                    Records
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminSchoolSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <div style={{ marginBottom: 14 }}>
        <Link href="/admin/schools" style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          ← Back to Schools
        </Link>
      </div>
      <SchoolSummaryTab schoolId={id} />
    </AdminShell>
  );
}
