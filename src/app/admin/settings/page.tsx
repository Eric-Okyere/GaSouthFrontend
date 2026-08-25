"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { TermSettings } from "@/lib/types";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

const TERMS: { key: "term1" | "term2" | "term3"; label: string }[] = [
  { key: "term1", label: "First term" },
  { key: "term2", label: "Second term" },
  { key: "term3", label: "Third term" },
];

// Trims a possibly-full ISO timestamp down to the "YYYY-MM-DD" a date
// input wants; null/undefined becomes "" so the input just shows empty.
function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function TermDatesSettings() {
  const [academicYear, setAcademicYear] = useState("");
  const [dates, setDates] = useState<Record<"term1" | "term2" | "term3", { startDate: string; endDate: string }>>({
    term1: { startDate: "", endDate: "" },
    term2: { startDate: "", endDate: "" },
    term3: { startDate: "", endDate: "" },
  });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    api
      .get<TermSettings>("/api/admin/term-dates")
      .then((res) => {
        setAcademicYear(res.academicYear);
        setDates({
          term1: { startDate: toDateInput(res.term1.startDate), endDate: toDateInput(res.term1.endDate) },
          term2: { startDate: toDateInput(res.term2.startDate), endDate: toDateInput(res.term2.endDate) },
          term3: { startDate: toDateInput(res.term3.startDate), endDate: toDateInput(res.term3.endDate) },
        });
      })
      .catch(() => toast("Could not load the term dates.", true))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTermField(key: "term1" | "term2" | "term3", field: "startDate" | "endDate", value: string) {
    setDates((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.put<TermSettings>("/api/admin/term-dates", { academicYear, ...dates });
      setAcademicYear(res.academicYear);
      setDates({
        term1: { startDate: toDateInput(res.term1.startDate), endDate: toDateInput(res.term1.endDate) },
        term2: { startDate: toDateInput(res.term2.startDate), endDate: toDateInput(res.term2.endDate) },
        term3: { startDate: toDateInput(res.term3.startDate), endDate: toDateInput(res.term3.endDate) },
      });
      toast("Term dates saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the term dates.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 16, maxWidth: 640 }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Academic term dates</h3>
      <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
        Set the open and closing date for each term. Leave a field blank if it isn&apos;t decided yet.
      </p>

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="field" style={{ maxWidth: 220 }}>
        <label htmlFor="academicYear">Academic year</label>
        <input id="academicYear" type="text" placeholder="e.g. 2026/2027" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
      </div>

      {loaded ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TERMS.map(({ key, label }) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: 12, alignItems: "end", padding: "10px 0", borderTop: "1px solid var(--line-soft)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor={`${key}-start`}>Opens</label>
                <input
                  id={`${key}-start`}
                  type="date"
                  value={dates[key].startDate}
                  onChange={(e) => setTermField(key, "startDate", e.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor={`${key}-end`}>Closes</label>
                <input
                  id={`${key}-end`}
                  type="date"
                  value={dates[key].endDate}
                  onChange={(e) => setTermField(key, "endDate", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>Loading…</p>
      )}

      <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !loaded} style={{ marginTop: 16 }}>
        {busy ? "Saving…" : "Save term dates"}
      </button>
    </form>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/admin/auth/change-password", { currentPassword, newPassword });
      toast("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not change password.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 16, maxWidth: 480 }}>
      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Change your password</h3>
      <div className="field">
        <input type="password" placeholder="Current password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div className="field">
        <input type="password" placeholder="New password (min. 8 characters)" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

function CreateAdmin() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/admin/auth/admins", { username, name, password });
      toast(`Admin account "${username}" created.`);
      setUsername("");
      setName("");
      setPassword("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create admin.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, maxWidth: 480 }}>
      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Add another admin</h3>
      <div className="field">
        <input placeholder="Username" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="field">
        <input placeholder="Full name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <input type="password" placeholder="Temporary password (min. 8 characters)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create admin"}
      </button>
    </form>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <TermDatesSettings />
      <ChangePassword />
      <CreateAdmin />
    </AdminShell>
  );
}
