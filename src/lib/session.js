// Tiny event bus so the API/auth layers (plain modules) can tell React that the session
// expired — i.e. the token couldn't be refreshed and the user must sign in again.
let expired = false;
const listeners = new Set();

export function markSessionExpired() {
  if (expired) return;
  expired = true;
  listeners.forEach((l) => l(true));
}

export function resetSession() {
  if (!expired) return;
  expired = false;
  listeners.forEach((l) => l(false));
}

export function isSessionExpired() {
  return expired;
}

export function onSessionExpiredChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
