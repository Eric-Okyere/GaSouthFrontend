// The anti-impersonation control for check-in/out: a staff ID alone can't
// prove identity (it's printed on the school's public QR flyer), so the
// browser a teacher registers from becomes that staff ID's trusted device —
// every check-in/out after that must present this same token, or the
// backend rejects it outright (see backend/src/utils/device.js,
// routes/registration.js and routes/public.js). This module just gives
// each browser a random, persistent token that travels with every
// registration and check-in/out request.
//
// This is NOT a hardware device ID — the web has no access to one. It's
// just a value in localStorage, so it's lost whenever a browser legitimately
// loses that storage (private browsing, "clear site data," a new phone).
// When that happens the teacher is locked out until an admin resets their
// device — see the README's "Individual check-in/out (device binding)"
// section for that tradeoff.

const STORAGE_KEY = "gsta_device_token";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Returns this browser's device token, creating and persisting one on
 *  first use. Returns "" if storage isn't available (SSR, private mode
 *  that blocks it, etc.) — the backend rejects a check-in/out sent with
 *  no token, so the check-in page shows a clear "allow this site to store
 *  data in your browser" message rather than a silent failure. */
export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = window.localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = randomToken();
      window.localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    return "";
  }
}
