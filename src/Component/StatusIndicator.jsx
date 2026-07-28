import { useEffect, useState } from "react";
import { useSocket } from "./SocketProvider";
import { isSessionExpired, onSessionExpiredChange } from "../lib/session";

// Live dot: green = connected & authed, yellow = reconnecting, red = session expired.
export default function StatusIndicator() {
  const { connected } = useSocket();
  const [expired, setExpired] = useState(isSessionExpired());

  useEffect(() => onSessionExpiredChange(setExpired), []);

  const { color, label, pulse } = expired
    ? { color: "bg-red-500", label: "Session expired", pulse: false }
    : connected
      ? { color: "bg-green-500", label: "Live", pulse: true }
      : { color: "bg-yellow-500", label: "Reconnecting…", pulse: false };

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-300" title={label}>
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
