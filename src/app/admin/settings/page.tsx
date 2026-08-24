"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/Toast";

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
      <ChangePassword />
      <CreateAdmin />
    </AdminShell>
  );
}
