"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { getPosition } from "@/lib/geo";
import { getDeviceToken } from "@/lib/device";
import { formatTime } from "@/lib/format";
import { Topbar } from "@/components/Topbar";

type SchoolInfo = { id: string; name: string; todayCount: number };
type Step = "loading" | "notfound" | "identify" | "action" | "done" | "already-done" | "locked";

interface ActionResult {
  type: "in" | "out";
  at: string;
  newDevice: boolean;
}

export default function CheckinPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = use(params);

  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [next, setNext] = useState<"in" | "out">("in");
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [checkedOutAt, setCheckedOutAt] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Anti-impersonation PIN: a teacher chooses one the first time they ever
  // check in, then re-enters it every time after. hasPin (from the status
  // lookup) decides which of the two the "action" step shows.
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  useEffect(() => {
    const draftKey = `gsta_draft_${schoolId}`;
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || "{}");
      // Restoring a browser-only (sessionStorage) draft right after mount is
      // deliberate, not a mistake the lint rule needs to flag.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (draft.name) setName(draft.name);
      if (draft.staffId) setStaffId(draft.staffId);
    } catch {
      // ignore malformed draft
    }

    api
      .get<SchoolInfo>(`/api/schools/${schoolId}`)
      .then((s) => {
        setSchool(s);
        setStep("identify");
      })
      .catch(() => setStep("notfound"));
  }, [schoolId]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !staffId.trim()) {
      setError("Please enter your name and staff number.");
      return;
    }
    setError(null);
    sessionStorage.setItem(`gsta_draft_${schoolId}`, JSON.stringify({ name, staffId }));

    try {
      const status = await api.get<{
        verifiedName: string | null;
        next: "in" | "out" | "done";
        checkedInAt: string | null;
        checkedOutAt: string | null;
        hasPin: boolean;
        locked: boolean;
        lockedUntil: string | null;
      }>(`/api/schools/${schoolId}/status?staffId=${encodeURIComponent(staffId)}`);
      setVerifiedName(status.verifiedName);
      setCheckedInAt(status.checkedInAt);
      setCheckedOutAt(status.checkedOutAt);
      setHasPin(status.hasPin);
      setPin("");
      setPinConfirm("");
      if (status.locked) {
        setLockedMessage("Too many incorrect PIN attempts on this staff ID. Please wait a while and try again.");
        setStep("locked");
      } else if (status.next === "done") {
        setStep("already-done");
      } else {
        setNext(status.next);
        setStep("action");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server. Check your connection and try again.");
    }
  }

  async function handleAction() {
    setError(null);

    if (!/^\d{4,6}$/.test(pin)) {
      setError(hasPin ? "Enter your 4–6 digit PIN." : "Choose a 4–6 digit PIN.");
      return;
    }
    if (!hasPin && pin !== pinConfirm) {
      setError("PIN and confirmation do not match.");
      return;
    }

    setSaving(true);
    const coords = await getPosition(8000);
    try {
      const res = await api.post<{
        type: "in" | "out";
        at: string;
        name: string;
        verified: boolean;
        flagged: boolean;
        distanceM: number | null;
        newDevice: boolean;
      }>(`/api/schools/${schoolId}/attendance`, {
        staffId,
        name,
        pin,
        pinConfirm: hasPin ? undefined : pinConfirm,
        lat: coords?.latitude,
        lng: coords?.longitude,
        deviceToken: getDeviceToken(),
      });
      setResult({ type: res.type, at: res.at, newDevice: res.newDevice });
      setPin("");
      setPinConfirm("");
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStep("already-done");
      } else if (err instanceof ApiError && err.status === 423) {
        setLockedMessage(err.message);
        setStep("locked");
      } else {
        // Wrong/invalid PIN or a mismatched confirmation — let them try
        // again without losing their place, but always clear the PIN
        // fields so a wrong guess is never sitting in the box.
        setPin("");
        setPinConfirm("");
        setError(err instanceof ApiError ? err.message : "Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function switchPerson() {
    setStep("identify");
    setError(null);
    setPin("");
    setPinConfirm("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 18px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: "clamp(22px, 5vw, 34px)" }}>
          {step === "loading" && <p style={{ color: "var(--ink-faint)" }}>Loading…</p>}

          {step === "notfound" && (
            <>
              <div className="error-box">This QR code doesn’t match a known school. Please contact the district admin.</div>
              <Link className="btn btn-ghost btn-block" style={{ marginTop: 16 }} href="/">
                ← Back to school directory
              </Link>
            </>
          )}

          {school && step !== "loading" && step !== "notfound" && (
            <>
              <span className="eyebrow">CHECK-IN / CHECK-OUT</span>
              <h2 style={{ fontSize: 22, marginTop: 6 }}>{school.name}</h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  color: "var(--ink-soft)",
                  background: "var(--surface-2)",
                  borderRadius: 999,
                  padding: "5px 11px",
                  marginTop: 10,
                }}
              >
                👥 {school.todayCount} checked in today
              </span>
              <div style={{ height: 1, background: "var(--line-soft)", margin: "20px 0" }} />

              {error && (
                <div className="error-box" style={{ marginBottom: 16 }}>
                  {error}
                </div>
              )}

              {step === "identify" && (
                <form onSubmit={handleContinue}>
                  <div className="field">
                    <label htmlFor="tName">Full name</label>
                    <input id="tName" type="text" autoComplete="name" placeholder="e.g. Comfort Ansah" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="tStaff">Staff / GES number</label>
                    <input id="tStaff" type="text" autoComplete="off" placeholder="e.g. GES-0123456" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
                    <span className="hint">Ask your head teacher if you don’t know yours.</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block btn-lg">
                    Continue
                  </button>
                </form>
              )}

              {step === "action" && (
                <>
                  {next === "out" && checkedInAt && (
                    <div className="status-pill in">
                      <span className="dot" />
                      Checked in {formatTime(checkedInAt)}
                    </div>
                  )}
                  <p style={{ marginTop: 12, fontSize: 15 }}>
                    Hi <strong>{verifiedName || name}</strong> — ready to {next === "in" ? "check in" : "check out"}?
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAction();
                    }}
                  >
                    {hasPin ? (
                      <div className="field" style={{ marginTop: 16 }}>
                        <label htmlFor="tPin">Your PIN</label>
                        <input
                          id="tPin"
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={6}
                          placeholder="••••"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        />
                        <span className="hint">Only you know this — it&apos;s what proves this check-{next} is really you.</span>
                      </div>
                    ) : (
                      <>
                        <div className="field" style={{ marginTop: 16 }}>
                          <label htmlFor="tPin">Choose a PIN</label>
                          <input
                            id="tPin"
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={6}
                            placeholder="4–6 digits"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                          />
                          <span className="hint">
                            This is a first-time setup — pick a private 4–6 digit PIN. You&apos;ll enter it every time you check in or out, so
                            nobody else can do it for you.
                          </span>
                        </div>
                        <div className="field">
                          <label htmlFor="tPinConfirm">Confirm PIN</label>
                          <input
                            id="tPinConfirm"
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={6}
                            placeholder="Re-enter your PIN"
                            value={pinConfirm}
                            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ marginTop: 10 }}>
                      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
                        {saving ? "Saving…" : next === "in" ? "Check In" : "Check Out"}
                      </button>
                    </div>
                  </form>
                  <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={switchPerson}>
                    Not you? Switch person
                  </button>
                  <p style={{ fontSize: 12.5, color: "var(--ink-faint)", display: "flex", gap: 7, marginTop: 14 }}>
                    📍 We&apos;ll check your location to confirm you&apos;re on-site. If you&apos;re outside this school&apos;s coverage area,
                    we can&apos;t record your {next === "in" ? "check-in" : "check-out"} — please go to the school and try again.
                  </p>
                </>
              )}

              {step === "locked" && (
                <>
                  <div className="error-box">{lockedMessage}</div>
                  <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={switchPerson}>
                    Not you? Switch person
                  </button>
                </>
              )}

              {step === "done" && result && (
                <>
                  <div className={`status-pill ${result.type}`}>
                    <span className="dot" />
                    {result.type === "in" ? "Checked in" : "Checked out"}
                  </div>
                  <div className="mono" style={{ fontSize: 34, fontWeight: 500, marginTop: 4 }}>
                    {formatTime(result.at)}
                  </div>
                  {result.newDevice && (
                    <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 10 }}>
                      This was from a phone we haven&apos;t seen you use before — normal if it&apos;s new or you cleared your browser. Your school
                      admin can see this too.
                    </p>
                  )}
                  <Link className="btn btn-ghost btn-block" style={{ marginTop: 18 }} href="/">
                    Done
                  </Link>
                </>
              )}

              {step === "already-done" && (
                <>
                  {checkedInAt && (
                    <div className="status-pill in" style={{ marginRight: 8 }}>
                      <span className="dot" />
                      Checked in {formatTime(checkedInAt)}
                    </div>
                  )}
                  {checkedOutAt && (
                    <div className="status-pill out">
                      <span className="dot" />
                      Checked out {formatTime(checkedOutAt)}
                    </div>
                  )}
                  <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 14 }}>
                    You’ve completed attendance for today, {verifiedName || name || "there"}. See you tomorrow!
                  </p>
                  <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={switchPerson}>
                    Not you? Switch person
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
