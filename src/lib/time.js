// The server stores sentStamp as a timezone-naive "dd/MM/yyyy HH:mm:ss" string in its own
// clock (UTC/GMT). Parse it AS UTC and render in the browser's local timezone (e.g. IST).
// Display-only — nothing about the stored data changes.
function parseServerStamp(stamp) {
  if (!stamp) return null;
  const m = String(stamp).match(
    /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (m) {
    const [, dd, MM, yyyy, HH, mm, ss] = m;
    return new Date(Date.UTC(+yyyy, +MM - 1, +dd, +HH, +mm, +(ss || 0)));
  }
  // Fall back to anything the Date constructor understands (e.g. ISO).
  const d = new Date(stamp);
  return isNaN(d.getTime()) ? null : d;
}

export function formatStamp(stamp) {
  const d = parseServerStamp(stamp);
  if (!d) return stamp ?? "";
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
