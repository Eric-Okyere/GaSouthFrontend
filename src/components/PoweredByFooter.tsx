export function PoweredByFooter() {
  return (
    <footer
      className="no-print"
      style={{
        padding: "14px clamp(16px, 4vw, 40px)",
        textAlign: "center",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--surface)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
        Powered by{" "}
        <a href="https://linkpii.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-soft)", fontWeight: 600 }}>
          LinkPii
        </a>{" "}
        · <a href="tel:0209317581" style={{ color: "var(--ink-faint)" }}>0209317581</a> ·{" "}
        <a href="https://linkpii.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-faint)" }}>
          linkpii.com
        </a>
      </span>
    </footer>
  );
}
