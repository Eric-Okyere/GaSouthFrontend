"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AttendanceRecord, School } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function RecordsTab() {
  const params = useSearchParams();
  const initialStaffId = params.get("staffId") || "";

  const [schools, setSchools] = useState<School[]>([]);
  // Arriving with a staffId (a click-through from Alerts or a school
  // summary) means "show me this person's records" — their full history,
  // not just today — so the date filter starts cleared in that case.
  const [date, setDate] = useState(params.get("date") ?? (initialStaffId ? "" : todayStr()));
  const [schoolId, setSchoolId] = useState(params.get("school") || "");
  const [staffId, setStaffId] = useState(initialStaffId);
  const [newDeviceOnly, setNewDeviceOnly] = useState(params.get("newDevice") === "true");
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [total, setTotal] = useState(0);
  const toast = useToast();

  useEffect(() => {
    api.get<School[]>("/api/admin/schools").then((list) => setSchools(list.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  function load() {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (schoolId) q.set("school", schoolId);
    if (staffId) q.set("staffId", staffId);
    if (newDeviceOnly) q.set("newDevice", "true");
    q.set("pageSize", "200");
    api
      .get<{ records: AttendanceRecord[]; total: number }>(`/api/admin/records?${q.toString()}`)
      .then((res) => {
        setRecords(res.records);
        setTotal(res.total);
      })
      .catch(() => toast("Could not load records.", true));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [date, schoolId, staffId, newDeviceOnly]);

  async function deleteRecord(id: string) {
    if (!confirm("Delete this attendance record? This cannot be undone.")) return;
    await api.delete(`/api/admin/records/${id}`).catch(() => toast("Could not delete.", true));
    load();
  }

  function exportUrl() {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (schoolId) q.set("school", schoolId);
    if (staffId) q.set("staffId", staffId);
    if (newDeviceOnly) q.set("newDevice", "true");
    return `/api/admin/records/export?${q.toString()}`;
  }

  const focusedName = staffId && records && records.length > 0 ? records[0].name : staffId;

  return (
    <>
      {staffId && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            padding: "9px 14px",
            marginBottom: 14,
            fontSize: 13.5,
          }}
        >
          Showing records for <strong>{focusedName}</strong> <span className="mono">({staffId})</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setStaffId("")}>
            Clear
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ border: "1.5px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: "9px 11px", minHeight: 40, fontSize: 13.5 }}
        />
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          style={{ border: "1.5px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: "9px 11px", minHeight: 40, fontSize: 13.5 }}
        >
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => setDate("")}>
          All dates
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setNewDeviceOnly((v) => !v)}
          style={newDeviceOnly ? { borderColor: "var(--bad)", color: "var(--bad)" } : undefined}
          title="Show only check-ins/outs whose PIN succeeded from a browser we hadn't seen for that staff ID before"
        >
          {newDeviceOnly ? "✓ " : ""}🆕 New device only
        </button>
        <span style={{ flex: 1 }} />
        <a className="btn btn-primary btn-sm" href={exportUrl()}>
          ⬇ Export CSV ({total})
        </a>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>School</th>
              <th>Name</th>
              <th>Staff ID</th>
              <th>Type</th>
              <th>Distance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records && records.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">
                  No records match these filters.
                </td>
              </tr>
            )}
            {records?.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.dateKey}</td>
                <td className="mono">{formatTime(r.at)}</td>
                <td>{r.school ? r.school.name : "(deleted school)"}</td>
                <td>
                  <button
                    onClick={() => setStaffId(r.staffId)}
                    style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textDecoration: staffId === r.staffId ? "none" : "underline", textDecorationColor: "var(--line)" }}
                    title="Show only this person's records"
                  >
                    {r.name}
                  </button>
                  {!r.verified && (
                    <span className="badge muted" style={{ marginLeft: 6 }}>
                      unverified
                    </span>
                  )}
                </td>
                <td className="mono">{r.staffId}</td>
                <td>
                  <span className={`badge ${r.type}`}>{r.type === "in" ? "Check-in" : "Check-out"}</span>
                  {r.flagged && (
                    <span className="badge flag" style={{ marginLeft: 6 }} title="Recorded from outside this school's GPS coverage area">
                      ⚠ out of coverage
                    </span>
                  )}
                  {r.newDevice && (
                    <span className="badge flag" style={{ marginLeft: 6 }} title="The PIN was correct, but from a browser we hadn't seen succeed with this staff ID before">
                      🆕 new device
                    </span>
                  )}
                </td>
                <td className="mono">{r.distanceM != null ? `${r.distanceM}m` : "—"}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteRecord(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminRecordsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<p style={{ color: "var(--ink-faint)" }}>Loading…</p>}>
        <RecordsTab />
      </Suspense>
    </AdminShell>
  );
}
