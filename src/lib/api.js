import { keycloak } from "./keycloak";

const API = import.meta.env.VITE_BACKEND_API;

function withAuth(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
}

/**
 * fetch() that guarantees a valid Keycloak token:
 *   1. refreshes the access token if it expires within 30s (no-op while still valid),
 *   2. on a 401, force-refreshes once and retries,
 *   3. if the refresh token itself is dead (SSO session gone), redirects to login.
 *
 * Use this for every authenticated request instead of raw fetch.
 */
export async function authFetch(path, options = {}) {
  try {
    await keycloak.updateToken(30);
  } catch {
    keycloak.login();
    throw new Error("Session expired");
  }

  let res = await withAuth(path, options);
  if (res.status === 401) {
    try {
      await keycloak.updateToken(-1); // force a refresh
    } catch {
      keycloak.login();
      throw new Error("Session expired");
    }
    res = await withAuth(path, options);
    if (res.status === 401) keycloak.login();
  }
  return res;
}
