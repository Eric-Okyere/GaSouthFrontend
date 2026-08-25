"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DirectoryTeacher } from "@/lib/types";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

type SortField = "name" | "staffId" | "school";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  field,
  sort,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sort === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: "pointer", userSelect: "none", color: active ? "var(--ink)" : undefined }}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <span style={{ marginLeft: 4, color: "var(--ink-faint)", fontSize: 11 }}>{active ? (dir === "asc" ? "▲" : "▼") : ""}</span>
    </th>
  );
}

function TeachersTab() {
  const [teachers, setTeachers] = useState<DirectoryTeacher[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<SortField>("name");
  const [dir, setDir] = useState<SortDir>("asc");
  const toast = useToast();

  useEffect(() => {
    api
      .get<DirectoryTeacher[]>("/api/admin/teachers")
      .then(setTeachers)
      .catch(() => toast("Could not load the teacher directory.", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSort(field: SortField) {
    if (field === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setDir("asc");
    }
  }

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = query.trim().toLowerCase();
    const rows = teachers.filter((t) => {
      if (activeOnly && !t.active) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.staffId.toLowerCase().includes(q) ||
        (t.school?.name || "").toLowerCase().includes(q)
      );
    });
    const key = (t: DirectoryTeacher) => (sort === "school" ? t.school?.name || "" : sort === "staffId" ? t.staffId : t.name);
    rows.sort((a, b) => key(a).localeCompare(key(b)) * (dir === "asc" ? 1 : -1));
    return rows;
  }, [teachers, query, activeOnly, sort, dir]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          type="search"
          placeholder="Search by name, staff ID, or school…"
          aria-label="Search teachers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 220, maxWidth: 360, width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid var(--line)", background: "var(--surface)" }}
        />
        <label style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Active only
        </label>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
          {teachers ? `${filtered.length} of ${teachers.length} teachers` : "Loading…"}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label="Name" field="name" sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="Staff ID" field="staffId" sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="School" field="school" sort={sort} dir={dir} onSort={onSort} />
              <th>Status</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {teachers && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  {teachers.length === 0 ? "No teachers registered yet." : "No teachers match your search."}
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/admin/teachers/${t.id}`} style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                    {t.name}
                  </Link>
                </td>
                <td className="mono">{t.staffId}</td>
                <td>{t.school ? t.school.name : "—"}</td>
                <td>
                  <span className={`badge ${t.active ? "in" : "muted"}`}>{t.active ? "active" : "inactive"}</span>
                </td>
                <td>
                  {t.deviceBound ? <span className="badge in">✓ bound</span> : <span className="badge muted">not bound</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminTeachersPage() {
  return (
    <AdminShell>
      <TeachersTab />
    </AdminShell>
  );
}
