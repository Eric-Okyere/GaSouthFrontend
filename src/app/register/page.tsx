"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { School } from "@/lib/types";
import { Topbar } from "@/components/Topbar";

const ASSOCIATIONS = ["GNAT", "NAGRAT", "CCT-GH", "Other"];
// GES's basic-school class range — Basic 1–6 (primary) through Basic 9 (JHS
// 3) covers every class a teacher at one of these schools can be assigned,
// so there's no "Other" here the way there is for association.
const CLASSES = ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6", "Basic 7", "Basic 8", "Basic 9"];

interface FormState {
  school: string;
  name: string;
  staffId: string;
  dateOfBirth: string;
  classTeaching: string;
  association: string;
  associationOther: string;
  phoneNumber: string;
}

const EMPTY: FormState = {
  school: "",
  name: "",
  staffId: "",
  dateOfBirth: "",
  classTeaching: "",
  association: "",
  associationOther: "",
  phoneNumber: "",
};

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedSchool = params.get("school") || "";

  const [schools, setSchools] = useState<School[] | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY, school: preselectedSchool });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<School[]>("/api/schools")
      .then((list) => {
        const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
        setSchools(sorted);
        // The `?school=` param on a "Register first" link (from the
        // check-in page, or typed by hand) now usually carries a school's
        // short code rather than its Mongo id — the <select> below still
        // keys its options by id, so resolve a code to the matching id
        // once the list is in.
        if (preselectedSchool && !sorted.some((s) => s.id === preselectedSchool)) {
          const byCode = sorted.find((s) => s.code && s.code.toUpperCase() === preselectedSchool.toUpperCase());
          if (byCode) setForm((f) => ({ ...f, school: byCode.id }));
        }
      })
      .catch(() => setError("Could not load the school list. Please reload the page."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const association = form.association === "Other" ? form.associationOther.trim() : form.association;
    if (!form.school || !form.name.trim() || !form.staffId.trim() || !form.dateOfBirth || !association || !form.phoneNumber.trim()) {
      setError("Please fill in every field — class teaching is the only optional one.");
      return;
    }

    setBusy(true);
    try {
      // A staff ID can only ever be registered once now — a resubmission
      // for one already on file is rejected (409) rather than treated as
      // an update, so a successful response here is always a brand-new
      // registration; see backend/src/routes/registration.js.
      const res = await api.post<{ teacher: { name: string; staffId: string } }>("/api/register", {
        school: form.school,
        name: form.name.trim(),
        staffId: form.staffId.trim(),
        dateOfBirth: form.dateOfBirth,
        classTeaching: form.classTeaching.trim(),
        association,
        phoneNumber: form.phoneNumber.trim(),
      });
      const school = schools?.find((s) => s.id === form.school);
      // Off to the welcome page instead of the old inline "done" card — the
      // card used to link "Back to school directory" at "/", but that page
      // has required an admin sign-in since round 9, so a teacher clicking
      // it landed on the admin login screen. The welcome page is public and
      // gives them a direct link to their own school's check-in page.
      const q = new URLSearchParams({
        name: res.teacher.name,
        school: school?.name || "",
        code: school?.code || school?.id || form.school,
      });
      router.push(`/welcome?${q.toString()}`);
      // Deliberately no `finally` here — busy stays true (button stays
      // disabled, showing "Saving…") through the navigation instead of
      // flashing the form re-enabled for an instant right before the route
      // changes. It's reset on the error path below, and a fresh mount of
      // this page (e.g. the browser back button) gets a clean busy=false
      // from the initial state anyway.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your details. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 18px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 460, padding: "clamp(22px, 5vw, 34px)" }}>
          <span className="eyebrow">TEACHER REGISTRATION</span>
          <h2 style={{ fontSize: 22, marginTop: 6 }}>Add your details</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 8 }}>
            One-time registration so the district has your details on file. You&apos;ll still check in/out by scanning your
            school&apos;s QR code afterwards.
          </p>
          <div style={{ height: 1, background: "var(--line-soft)", margin: "20px 0" }} />

          {error && (
            <div className="error-box" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="school">School</label>
              <select id="school" value={form.school} onChange={(e) => set("school", e.target.value)}>
                <option value="">{schools ? "Select your school…" : "Loading schools…"}</option>
                {schools?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" autoComplete="name" placeholder="e.g. Comfort Ansah" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="staffId">Staff / GES number</label>
              <input id="staffId" type="text" autoComplete="off" placeholder="e.g. GES-0123456" value={form.staffId} onChange={(e) => set("staffId", e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="classTeaching">Class teaching</label>
              <select id="classTeaching" value={form.classTeaching} onChange={(e) => set("classTeaching", e.target.value)}>
                <option value="">Select class…</option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="hint">Leave blank if you don&apos;t teach a specific class.</span>
            </div>

            <div className="field">
              <label htmlFor="association">Teachers&apos; association</label>
              <select id="association" value={form.association} onChange={(e) => set("association", e.target.value)}>
                <option value="">Select…</option>
                {ASSOCIATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {form.association === "Other" && (
              <div className="field">
                <label htmlFor="associationOther">Please specify</label>
                <input id="associationOther" type="text" value={form.associationOther} onChange={(e) => set("associationOther", e.target.value)} />
              </div>
            )}

            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="e.g. 024 400 0000" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy} style={{ marginTop: 6 }}>
              {busy ? "Saving…" : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--ink-faint)" }}>Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
