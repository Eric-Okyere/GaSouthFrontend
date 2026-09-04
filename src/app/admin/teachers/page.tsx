"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DirectoryTeacher, School } from "@/lib/types";
import { formatTime, todayStr } from "@/lib/format";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

type SortField = "name" | "staffId" | "school" | "arrival";
type SortDir = "asc" | "desc";
// Only meaningful when a date is set (see `date` state below, which is what
// populates attendanceStatus per teacher). "all" shows everyone; the rest
// isolate one bucket — the two arrival ones are what round 22 asked for
// ("sort out late and teachers who come early"), "present"/"absent" reuse
// the same status the column already shows.
type ArrivalFilter = "all" | "early" | "late" | "present" | "absent";

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
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  // Which day's check-in/out status to show alongside the roster — defaults
  // to today (a quick "who's here right now, district-wide" view). "" means
  // "All dates": no status column, just the plain roster.
  const [date, setDate] = useState(todayStr());
  const [teachers, setTeachers] = useState<DirectoryTeacher[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [arrivalFilter, setArrivalFilter] = useState<ArrivalFilter>("all");
  const [sort, setSort] = useState<SortField>("name");
  const [dir, setDir] = useState<SortDir>("asc");
  const toast = useToast();

  useEffect(() => {
    api.get<School[]>("/api/admin/schools").then((list) => setSchools(list.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  function load() {
    const q = new URLSearchParams();
    if (schoolId) q.set("school", schoolId);
    if (date) q.set("date", date);
    api
      .get<DirectoryTeacher[]>(`/api/admin/teachers?${q.toString()}`)
      .then(setTeachers)
      .catch(() => toast("Could not load the teacher directory.", true));
  }
  useEffect(load, [schoolId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSort(field: SortField) {
    if (field === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setDir("asc");
    }
  }

  function exportUrl() {
    const q = new URLSearchParams();
    if (schoolId) q.set("school", schoolId);
    if (date) q.set("date", date);
    return `/api/admin/teachers/export?${q.toString()}`;
  }

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = query.trim().toLowerCase();
    const rows = teachers.filter((t) => {
      if (activeOnly && !t.active) return false;
      // Only applies once a date is selected (that's the only time
      // attendanceStatus is attached at all) — see the `date &&` guard.
      if (date && arrivalFilter !== "all") {
        const status = t.attendanceStatus;
        if (arrivalFilter === "present" && !status?.checkedInAt) return false;
        if (arrivalFilter === "absent" && status?.checkedInAt) return false;
        if (arrivalFilter === "early" && status?.arrivalStatus !== "early") return false;
        if (arrivalFilter === "late" && status?.arrivalStatus !== "late") return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.staffId.toLowerCase().includes(q) ||
        (t.school?.name || "").toLowerCase().includes(q)
      );
    });
    if (sort === "arrival") {
      // Absent (no check-in on file for the date) sorts last regardless of
      // direction — there's no arrival time to rank against early/late.
      const rank = (t: DirectoryTeacher) => {
        const status = t.attendanceStatus;
        if (!status?.checkedInAt) return dir === "asc" ? 2 : -2;
        return status.arrivalStatus === "late" ? 1 : 0;
      };
      rows.sort((a, b) => (rank(a) - rank(b)) * (dir === "asc" ? 1 : -1));
    } else {
      const key = (t: DirectoryTeacher) => (sort === "school" ? t.school?.name || "" : sort === "staffId" ? t.staffId : t.name);
      rows.sort((a, b) => key(a).localeCompare(key(b)) * (dir === "asc" ? 1 : -1));
    }
    return rows;
  }, [teachers, query, activeOnly, arrivalFilter, date, sort, dir]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          max={todayStr()}
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
        <span style={{ flex: 1 }} />
        <a className="btn btn-primary btn-sm" href={exportUrl()}>
          ⬇ Export CSV ({teachers ? teachers.length : 0})
        </a>
      </div>

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
        {date && (
          <select
            value={arrivalFilter}
            onChange={(e) => setArrivalFilter(e.target.value as ArrivalFilter)}
            aria-label={`Filter by ${date === todayStr() ? "today's" : date + "'s"} status`}
            style={{ border: "1.5px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: "9px 11px", minHeight: 40, fontSize: 13.5 }}
          >
            <option value="all">All ({date === todayStr() ? "today" : date})</option>
            <option value="early">Early only</option>
            <option value="late">Late only</option>
            <option value="present">Present (any time)</option>
            <option value="absent">Absent</option>
          </select>
        )}
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
              <th>Roster</th>
              <th>Device</th>
              {date && <SortHeader label={date === todayStr() ? "Today" : date} field="arrival" sort={sort} dir={dir} onSort={onSort} />}
            </tr>
          </thead>
          <tbody>
            {teachers && filtered.length === 0 && (
              <tr>
                <td colSpan={date ? 6 : 5} className="empty-state">
                  {teachers.length === 0 ? "No teachers match these filters." : "No teachers match your search."}
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
                {date && (
                  <td>
                    {t.attendanceStatus?.checkedInAt ? (
                      <span
                        className={`badge ${t.attendanceStatus.arrivalStatus === "late" ? "out" : "in"}`}
                        title={`Checked in ${formatTime(t.attendanceStatus.checkedInAt)}`}
                      >
                        {t.attendanceStatus.arrivalStatus === "late" ? "Late" : "Early"}
                      </span>
                    ) : (
                      <span className="badge flag">absent</span>
                    )}
                  </td>
                )}
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
