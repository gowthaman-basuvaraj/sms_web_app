import PropTypes from "prop-types";
import avatar from "../store/AvatarLogo";

const PALETTE = [
  "#e11d48", "#db2777", "#9333ea", "#7c3aed", "#4f46e5", "#2563eb",
  "#0891b2", "#0d9488", "#059669", "#16a34a", "#ca8a04", "#ea580c",
  "#dc2626", "#475569",
];

function colorFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// A deterministic colored-initials avatar as an inline SVG data URI — used for any sender
// that doesn't have a bundled logo, so every sender still gets a distinct avatar.
function initialsDataUri(sender) {
  const clean = (sender || "?").replace(/[^A-Za-z0-9]/g, "");
  const label = (clean.slice(0, 2) || "?").toUpperCase();
  const bg = colorFor(clean.toLowerCase() || "?");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<rect width="48" height="48" rx="24" fill="${bg}"/>` +
    `<text x="24" y="24" dy=".35em" text-anchor="middle" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" ` +
    `fill="#ffffff">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const Avatar = ({ imageURL, sender }) => {
  const fallback = initialsDataUri(sender);
  return (
    <div className="p-2 h-12 w-12 shrink-0">
      <img
        src={imageURL || fallback}
        alt={sender}
        onError={(e) => {
          if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
        }}
        className="h-full w-full object-cover inline-block border border-green-500 rounded-full ring-2 ring-white ring-opacity-50"
      />
    </div>
  );
};

Avatar.propTypes = {
  imageURL: PropTypes.string,
  sender: PropTypes.string.isRequired,
};

export default Avatar;

/**
 * Returns the best matching bundled logo for a sender, or a generated initials avatar.
 * Matching is substring-based (DLT sender codes embed the brand, e.g. IM-AXISBK -> axis),
 * preferring the most specific (longest) key; 2-char keys require an exact match to avoid
 * false positives like "vi" inside "service".
 */
export const HandleAvatar = (sender) => {
  const target = (sender || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!target) return initialsDataUri(sender);

  let bestKey = null;
  let bestLen = 0;
  for (const key of Object.keys(avatar)) {
    if (key === "default") continue;
    const k = key.toLowerCase();
    const match = k.length >= 3 ? target.includes(k) : target === k;
    if (match && k.length > bestLen) {
      bestKey = key;
      bestLen = k.length;
    }
  }
  return bestKey ? avatar[bestKey] : initialsDataUri(sender);
};
