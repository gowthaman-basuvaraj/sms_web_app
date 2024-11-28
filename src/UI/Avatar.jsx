import PropTypes from "prop-types";
import avatar from "../store/AvatarLogo";
import levenshtein from "fast-levenshtein";

const Avatar = ({ imageURL, sender }) => {
  return (
    <div className="p-2">
      <img
        src={imageURL}
        alt={sender}
        className="inline-block border border-green-500 h-8 w-8 rounded-full ring-2 ring-white ring-opacity-50"
      />
    </div>
  );
};

Avatar.propTypes = {
  imageURL: PropTypes.string.isRequired,
  sender: PropTypes.string.isRequired,
};

export default Avatar;

export const HandleAvatar = (sender) => {
  const candidates = Object.keys(avatar);
  const target = sender?.toLowerCase() || "";

  let bestMatch = { key: null, score: Infinity };

  candidates.forEach((key) => {
    const keyLower = key.toLowerCase();

    if (target.includes(keyLower) || keyLower.includes(target)) {
      bestMatch = { key, score: 0 };
      return;
    }
    const score = levenshtein.get(target, keyLower);
    if (score < bestMatch.score) {
      bestMatch = { key, score };
    }
  });

  return bestMatch.key && bestMatch.score < 4
    ? avatar[bestMatch.key]
    : avatar.default;
};
