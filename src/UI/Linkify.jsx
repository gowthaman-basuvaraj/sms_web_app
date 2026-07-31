import PropTypes from "prop-types";

// Matches, in order: http(s):// links, www. links, bare domains that have a /path
// (e.g. bit.ly/xyz, amazon.com/deals), and bare domains on a "safe" (non-word) TLD with
// no path (e.g. hdfc.com, x.io). Requiring a path for other TLDs avoids false positives
// like "delivered.in 2 days" or "Rs.500".
const URL_RE =
  /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s]*|(?:[a-z0-9-]+\.)+(?:com|net|org|io|app|xyz|info|dev|link|gov|edu)\b)/gi;
// Trailing punctuation that shouldn't be part of the link (e.g. "visit https://x.com.").
const TRAILING = /[.,!?;:)\]}'"]+$/;

// Renders message text with clickable URLs. Builds real <a> nodes (never innerHTML), so
// the message content can't inject markup — safe against XSS.
export default function Linkify({ text }) {
  if (!text) return null;

  const nodes = [];
  let last = 0;
  let match;
  const re = new RegExp(URL_RE); // fresh instance so lastIndex isn't shared

  while ((match = re.exec(text)) !== null) {
    let url = match[0];
    let trailing = "";
    const t = url.match(TRAILING);
    if (t) {
      trailing = t[0];
      url = url.slice(0, url.length - trailing.length);
    }

    if (match.index > last) nodes.push(text.slice(last, match.index));

    const href = url.startsWith("http") ? url : `https://${url}`;
    nodes.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline break-all"
      >
        {url}
      </a>
    );
    if (trailing) nodes.push(trailing);
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}

Linkify.propTypes = {
  text: PropTypes.string,
};
