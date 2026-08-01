import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { authFetch } from "../lib/api";

// Server-side per-sender retention. "Keep forever" (0) is the default; picking a window
// makes the hourly cron delete this sender's messages once they're older than it. This is
// independent of the mobile app's own retention settings.
const OPTIONS = [
  { label: "Keep forever", days: 0 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
  { label: "1 year", days: 365 },
];

export default function RetentionSelect({ sender }) {
  const [days, setDays] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sender) return;
    let active = true;
    (async () => {
      try {
        const res = await authFetch("/sender-retention");
        const data = await res.json();
        if (!active) return;
        const rule = (data.rules || []).find((r) => r.sender === sender);
        setDays(rule ? rule.days : 0);
      } catch (err) {
        console.error("Failed to load retention:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [sender]);

  const onChange = async (e) => {
    const value = Number(e.target.value);
    setDays(value);
    setSaving(true);
    try {
      await authFetch("/sender-retention", {
        method: "POST",
        body: JSON.stringify({ sender, days: value }),
      });
    } catch (err) {
      console.error("Failed to save retention:", err);
    } finally {
      setSaving(false);
    }
  };

  // A window set outside these presets (e.g. via another client) still shows correctly.
  const hasCustom = days > 0 && !OPTIONS.some((o) => o.days === days);

  return (
    <select
      value={days}
      onChange={onChange}
      disabled={saving}
      title="Auto-delete old messages from this sender (server-side)"
      className="shrink-0 rounded border border-gray-600 bg-gray-700 px-1 py-2 text-sm text-white"
    >
      {OPTIONS.map((o) => (
        <option key={o.days} value={o.days}>
          {o.label}
        </option>
      ))}
      {hasCustom && <option value={days}>{days} days</option>}
    </select>
  );
}

RetentionSelect.propTypes = {
  sender: PropTypes.string,
};
