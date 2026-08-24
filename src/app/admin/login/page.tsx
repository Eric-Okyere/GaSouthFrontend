"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Topbar } from "@/components/Topbar";
import type { AdminUser } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post<{ admin: AdminUser }>("/api/admin/auth/login", { username, password });
      router.replace(params.get("next") || "/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: "100%", maxWidth: 420, padding: "clamp(22px, 5vw, 34px)" }}>
        <span className="eyebrow">DISTRICT ADMIN</span>
        <h2 style={{ marginTop: 6 }}>Sign in</h2>
        <div style={{ height: 1, background: "var(--line-soft)", margin: "20px 0" }} />
        {error && (
          <div className="error-box" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <Topbar />
      <Suspense fallback={<p style={{ padding: 24, color: "var(--ink-faint)" }}>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
