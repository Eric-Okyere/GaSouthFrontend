import { telHref, whatsappHref } from "@/lib/phone";

export function ContactButtons({ phone }: { phone?: string }) {
  if (!phone) return <span style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>no phone on file</span>;

  const tel = telHref(phone);
  const wa = whatsappHref(phone);

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tel && (
        <a className="btn btn-ghost btn-sm" href={tel}>
          📞 Call
        </a>
      )}
      {wa && (
        <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noopener noreferrer">
          💬 WhatsApp
        </a>
      )}
    </div>
  );
}
