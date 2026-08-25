// A soft "recognized device" signal, paired with the check-in PIN. A PIN
// can be read aloud over a phone call and typed into someone else's phone;
// this makes that specific shortcut visible (never blocking — see the
// backend's utils/device.js) by giving each browser a random, persistent
// token that travels with every check-in/out request.
//
// This is NOT a hardware device ID — the web has no access to one. It's
// just a value in localStorage, so it's lost whenever a browser legitimately
// loses that storage (private browsing, "clear site data," a new phone).
// That's expected and fine: the backend only ever flags an unrecognized
// device for admin review, it never rejects a check-in over it.

const STORAGE_KEY = "gsta_device_token";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Returns this browser's device token, creating and persisting one on
 *  first use. Returns "" if storage isn't available (SSR, private mode
 *  that blocks it, etc.) — the check-in still works, it just won't
 *  contribute to the recognized-device signal for that one attempt. */
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
