"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OpenCheckin, School } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";
import { ContactButtons } from "@/components/ContactButtons";

function AlertsTab() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [openCheckins, setOpenCheckins] = useState<OpenCheckin[] | null>(null);
  const toast = useToast();

  useEffect(() => {
    api.get<School[]>("/api/admin/schools").then((list) => setSchools(list.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  function load() {
    const q = new URLSearchParams();
    if (schoolId) q.set("school", schoolId);
    api
      .get<{ date: string; openCheckins: OpenCheckin[] }>(`/api/admin/open-checkins?${q.toString()}`)
      .then((res) => setOpenCheckins(res.openCheckins))
      .catch(() => toast("Could not load today's open check-ins.", true));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [schoolId]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>Checked in, not checked out</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 3 }}>
            Today only — anyone below checked in but hasn&apos;t checked out yet.
          </p>
        </div>
        <span style={{ flex: 1 }} />
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
        <button className="btn btn-ghost btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Checked in</th>
              <th>School</th>
              <th>Name</th>
              <th>Staff ID</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {openCheckins && openCheckins.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  Nobody&apos;s left checked in — everyone who came in today has checked out. 🎉
                </td>
              </tr>
            )}
            {openCheckins?.map((r) => (
              <tr key={r.id}>
                <td className="mono">{formatTime(r.checkedInAt)}</td>
                <td>{r.school ? r.school.name : "(deleted school)"}</td>
                <td>{r.name}</td>
                <td className="mono">{r.staffId}</td>
                <td>
                  <ContactButtons phone={r.phoneNumber} />
                </td>
                <td>
                  <Link
                    className="btn btn-ghost btn-sm"
                    href={`/admin/records?school=${r.school?.id || ""}&staffId=${encodeURIComponent(r.staffId)}`}
                  >
                    View records
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

export default function AdminAlertsPage() {
  return (
    <AdminShell>
      <AlertsTab />
    </AdminShell>
  );
}
