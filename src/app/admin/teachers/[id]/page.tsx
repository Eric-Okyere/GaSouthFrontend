"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { TeacherDetailResponse } from "@/lib/types";
import { formatDateTime, todayStr } from "@/lib/format";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";
import { ContactButtons } from "@/components/ContactButtons";

function startOfMonthStr() {
  return todayStr().slice(0, 7) + "-01";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 14.5, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function TeacherDetailTab({ teacherId }: { teacherId: string }) {
  const [start, setStart] = useState(startOfMonthStr());
  const [end, setEnd] = useState(todayStr());
  const [detail, setDetail] = useState<TeacherDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const toast = useToast();

  function load() {
    api
      .get<TeacherDetailResponse>(`/api/admin/teachers/${teacherId}?start=${start}&end=${end}`)
      .then((res) => {
        setDetail(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load this teacher."));
  }
  useEffect(load, [teacherId, start, end]);

  async function resetDevice() {
    if (!detail) return;
    if (!confirm(`Reset ${detail.teacher.name}'s device? Their next check-in will bind whatever device they use then.`)) return;
    setResetting(true);
    try {
      await api.post(`/api/admin/teachers/${teacherId}/reset-device`);
      toast("Device reset. A new one will be bound on their next check-in.");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not reset device.", true);
    } finally {
      setResetting(false);
    }
  }

  if (error) return <div className="error-box">{error}</div>;
  if (!detail) return <p style={{ color: "var(--ink-faint)" }}>Loading…</p>;

  const { teacher, attendance } = detail;

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <Link href="/admin/teachers" style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          ← Back to Teachers
        </Link>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>{teacher.name}</h1>
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 3 }}>
              {teacher.staffId} · {teacher.school ? teacher.school.name : "no school on file"}
            </div>
          </div>
          <span className={`badge ${teacher.active ? "in" : "muted"}`}>{teacher.active ? "active" : "inactive"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 18 }}>
          <Field label="Class teaching" value={teacher.classTeaching || "—"} />
          <Field label="Association" value={teacher.association || "—"} />
          <Field label="Date of birth" value={teacher.dateOfBirth || "—"} />
          <Field label="Source" value={teacher.source === "self" ? "Self-registered" : "Admin-added"} />
          <Field
            label="Device"
            value={
              teacher.deviceBound ? (
                <span className="badge in">✓ bound{teacher.deviceBoundAt ? ` · ${formatDateTime(teacher.deviceBoundAt)}` : ""}</span>
              ) : (
                <span className="badge muted">not bound</span>
              )
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <ContactButtons phone={teacher.phoneNumber} />
          <Link className="btn btn-ghost btn-sm" href={`/admin/records?staffId=${encodeURIComponent(teacher.staffId)}`}>
            View records
          </Link>
          {teacher.deviceBound && (
            <button className="btn btn-ghost btn-sm" onClick={resetDevice} disabled={resetting}>
              {resetting ? "Resetting…" : "Reset device"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ fontSize: 17 }}>Present / absent</h2>
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
      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 14 }}>
        Weekends aren&apos;t counted as school days. Counted only from whichever is later: the range start, or the day {teacher.name.split(" ")[0]} joined the roster.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div className="stat-tile">
          <div className="n mono">{attendance.presentDays}</div>
          <div className="l">Present days</div>
        </div>
        <div className="stat-tile" style={attendance.absentDays > 0 ? { borderColor: "var(--bad)" } : undefined}>
          <div className="n mono" style={attendance.absentDays > 0 ? { color: "var(--bad)" } : undefined}>
            {attendance.absentDays}
          </div>
          <div className="l">Absent days</div>
        </div>
        <div className="stat-tile">
          <div className="n mono">{attendance.totalSchoolDays}</div>
          <div className="l">School days ({attendance.start} → {attendance.end})</div>
        </div>
      </div>
    </>
  );
}

export default function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <TeacherDetailTab teacherId={id} />
    </AdminShell>
  );
}
