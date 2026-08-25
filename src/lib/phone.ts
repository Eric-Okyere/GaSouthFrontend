// Ghana-focused phone helpers. The registration form collects numbers in
// the usual local format (e.g. "024 400 0000" / "0244000000"), so that's
// what these assume: a leading 0 gets swapped for the country code (233)
// for WhatsApp's click-to-chat links, which require full international
// digits with no leading zero. A number already typed with a country code
// (e.g. "+233...") is left alone. Wrong for a non-Ghanaian number typed in
// local format elsewhere, but there's no reliable way to tell that apart
// from a Ghanaian one without asking the country separately.

export function telHref(phone: string): string | null {
  const cleaned = phone.trim();
  if (!cleaned) return null;
  return `tel:${cleaned.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) {
    digits = "233" + digits.slice(1);
  }
  return `https://wa.me/${digits}`;
}
