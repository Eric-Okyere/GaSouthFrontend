"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { School, Teacher } from "@/lib/types";
import { getPosition } from "@/lib/geo";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";
import { ContactButtons } from "@/components/ContactButtons";

function TeacherRoster({ school }: { school: School }) {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [staffId, setStaffId] = useState("");
  const [name, setName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const toast = useToast();

  function load() {
    api
      .get<Teacher[]>(`/api/admin/schools/${school.id}/teachers`)
      .then(setTeachers)
      .catch(() => toast("Could not load the roster.", true));
  }
  useEffect(load, [school.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId.trim() || !name.trim()) return;
    try {
      await api.post(`/api/admin/schools/${school.id}/teachers`, { staffId, name });
      setStaffId("");
      setName("");
      load();
      toast("Teacher added.");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add teacher.", true);
    }
  }

  async function removeTeacher(id: string) {
    if (!confirm("Remove this teacher from the roster?")) return;
    await api.delete(`/api/admin/teachers/${id}`).catch(() => toast("Could not remove teacher.", true));
    load();
  }

  async function resetDevice(t: Teacher) {
    if (!confirm(`Reset ${t.name}'s device? Their next check-in will bind whatever device they use then.`)) return;
    try {
      await api.post(`/api/admin/teachers/${t.id}/reset-device`);
      toast("Device reset. A new one will be bound on their next check-in.");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not reset device.", true);
    }
  }

  async function importBulk() {
    const rows = bulkText
      .split("\n")
      .map((line) => line.split(","))
      .map(([staffId, ...rest]) => ({ staffId: (staffId || "").trim(), name: rest.join(",").trim() }))
      .filter((r) => r.staffId || r.name);
    if (!rows.length) {
      toast("Paste some rows first (one per line: staffId,name).", true);
      return;
    }
    setBulkBusy(true);
    try {
      const res = await api.post<{ created: number; updated: number; skipped: { reason: string }[] }>(
        `/api/admin/schools/${school.id}/teachers/bulk`,
        { rows }
      );
      toast(`Imported: ${res.created} added, ${res.updated} updated${res.skipped.length ? `, ${res.skipped.length} skipped` : ""}.`);
      setBulkText("");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Import failed.", true);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div style={{ padding: "14px 16px", background: "var(--surface-2)", borderTop: "1px solid var(--line-soft)" }}>
      <div className="table-wrap" style={{ marginBottom: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Class</th>
              <th>Association</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Device</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teachers && teachers.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">
                  No roster entries yet — teachers can register themselves at /register, or add one below.
                </td>
              </tr>
            )}
            {teachers?.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.staffId}</td>
                <td>{t.name}</td>
                <td>{t.classTeaching || "—"}</td>
                <td>{t.association || "—"}</td>
                <td>
                  <ContactButtons phone={t.phoneNumber} />
                </td>
                <td>
                  <span className={`badge ${t.source === "self" ? "in" : "muted"}`}>{t.source === "self" ? "self-registered" : "admin-added"}</span>
                </td>
                <td>
                  {t.deviceBound ? (
                    <span className="badge in" title="A device is bound for this staff ID — check-ins must come from it">
                      ✓ bound
                    </span>
                  ) : (
                    <span className="badge muted">not bound</span>
                  )}
                </td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {t.deviceBound && (
                    <button className="btn btn-ghost btn-sm" onClick={() => resetDevice(t)}>
                      Reset Device
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => removeTeacher(t.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addTeacher} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input placeholder="Staff ID" value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ minHeight: 40, borderRadius: 9, border: "1.5px solid var(--line)", padding: "0 11px", width: 160 }} />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ minHeight: 40, borderRadius: 9, border: "1.5px solid var(--line)", padding: "0 11px", flex: 1, minWidth: 160 }} />
        <button className="btn btn-primary btn-sm" type="submit">
          Add
        </button>
      </form>

      <details>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Bulk import (paste CSV: staffId,name per line)</summary>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          placeholder={"GES-0001,Comfort Ansah\nGES-0002,Kwame Mensah"}
          style={{ width: "100%", marginTop: 8, borderRadius: 9, border: "1.5px solid var(--line)", padding: 10, fontFamily: "var(--font-mono-stack)", fontSize: 13 }}
        />
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={importBulk} disabled={bulkBusy}>
          {bulkBusy ? "Importing…" : "Import"}
        </button>
      </details>
    </div>
  );
}

function SchoolsTab() {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const toast = useToast();

  function load() {
    api
      .get<School[]>("/api/admin/schools")
      .then((list) => setSchools(list.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => toast("Could not load schools.", true));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post("/api/admin/schools", { name: newName.trim() });
      setNewName("");
      load();
      toast("School added.");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add school.", true);
    }
  }

  async function renameSchool(s: School) {
    const name = prompt("Rename school:", s.name);
    if (!name || !name.trim()) return;
    await api.patch(`/api/admin/schools/${s.id}`, { name: name.trim() }).catch(() => toast("Could not rename.", true));
    load();
  }

  async function deleteSchool(s: School) {
    if (!confirm(`Delete "${s.name}"? If it has attendance history it will be deactivated instead of removed.`)) return;
    await api.delete(`/api/admin/schools/${s.id}`).catch(() => toast("Could not delete.", true));
    load();
  }

  async function captureAnchor(s: School) {
    setCapturingId(s.id);
    const coords = await getPosition(10000);
    setCapturingId(null);
    if (!coords) {
      toast("Could not get this device’s location.", true);
      return;
    }
    await api.post(`/api/admin/schools/${s.id}/anchor`, { lat: coords.latitude, lng: coords.longitude }).catch(() => toast("Could not save location.", true));
    toast("Location saved. Stand at the school gate next time for best accuracy.");
    load();
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        {schools?.map((s) => (
          <div key={s.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 16px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  {s.anchorLat != null ? `📍 ${s.anchorLat.toFixed(5)}, ${s.anchorLng?.toFixed(5)}` : "no GPS anchor set"}
                  {s.active === false && "  ·  inactive"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  {expanded === s.id ? "Hide roster" : "Manage roster"}
                </button>
                <Link className="btn btn-ghost btn-sm" href={`/admin/schools/${s.id}/summary`}>
                  📊 Summary
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => captureAnchor(s)} disabled={capturingId === s.id}>
                  {capturingId === s.id ? "Locating…" : `📍 ${s.anchorLat != null ? "Re-capture" : "Capture"} GPS`}
                </button>
                {s.anchorLat != null ? (
                  <a className="btn btn-ghost btn-sm" href={`/admin/schools/${s.id}/print`} target="_blank" rel="noopener noreferrer">
                    🖨 Print QR
                  </a>
                ) : (
                  <button className="btn btn-ghost btn-sm" disabled title="Capture this school's GPS anchor first">
                    🖨 Print QR
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => renameSchool(s)}>
                  Rename
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSchool(s)}>
                  Delete
                </button>
              </div>
            </div>
            {expanded === s.id && <TeacherRoster school={s} />}
          </div>
        ))}
        {schools && schools.length === 0 && <div className="empty-state">No schools yet — add one below.</div>}
      </div>

      <form onSubmit={addSchool} className="card" style={{ padding: 16, maxWidth: 480, display: "flex", gap: 10 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="School name"
          style={{ flex: 1, minHeight: 44, borderRadius: 9, border: "1.5px solid var(--line)", padding: "0 12px" }}
        />
        <button className="btn btn-primary" type="submit">
          Add school
        </button>
      </form>
    </>
  );
}

export default function AdminSchoolsPage() {
  return (
    <AdminShell>
      <SchoolsTab />
    </AdminShell>
  );
}
