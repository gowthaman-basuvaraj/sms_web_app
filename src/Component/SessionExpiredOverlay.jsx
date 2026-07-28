import { useEffect, useState } from "react";
import { keycloak } from "../lib/keycloak";
import { isSessionExpired, onSessionExpiredChange } from "../lib/session";

// A blocking prompt shown when the session can no longer be refreshed, so the user is
// told (instead of silently failing) and can re-authenticate with one click.
export default function SessionExpiredOverlay() {
  const [expired, setExpired] = useState(isSessionExpired());

  useEffect(() => onSessionExpiredChange(setExpired), []);

  if (!expired) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6 text-center text-white shadow-xl">
        <h2 className="text-lg font-bold">Session expired</h2>
        <p className="mt-2 text-sm text-gray-300">
          Your login has expired. Sign in again to continue.
        </p>
        <button
          onClick={() => keycloak.login()}
          className="mt-4 w-full rounded bg-blue-600 py-2 font-semibold hover:bg-blue-700"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}
