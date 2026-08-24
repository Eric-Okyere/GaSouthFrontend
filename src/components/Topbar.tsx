import Link from "next/link";

export function Topbar() {
  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px clamp(16px, 4vw, 40px)",
        borderBottom: "1px solid var(--line-soft)",
        background: "var(--surface)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 9, textDecoration: "none", color: "var(--ink)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-ink)",
            fontSize: 15,
            flex: "none",
          }}
        >
          🏫
        </span>
        <span>
          <span style={{ fontFamily: "var(--font-display-stack)", fontWeight: 600, fontSize: 18 }}>Ga South Attendance</span>
          <br />
          <span className="eyebrow">TEACHER CHECK-IN / CHECK-OUT</span>
        </span>
      </Link>
      <nav style={{ display: "flex", gap: 4 }}>
        <Link
          href="/register"
          style={{ fontSize: 13.5, color: "var(--ink-soft)", textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}
        >
          Register
        </Link>
        <Link
          href="/admin"
          style={{ fontSize: 13.5, color: "var(--ink-soft)", textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}
        >
          Admin
        </Link>
      </nav>
    </div>
  );
}
