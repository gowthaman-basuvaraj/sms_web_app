import PropTypes from "prop-types";
import avatar from "../store/AvatarLogo";
import levenshtein from "fast-levenshtein";

const Avatar = ({ imageURL, sender }) => {
  return (
    <div className="p-2 h-12 w-12">
      <img
        src={imageURL}
        alt={sender}
        className="inline-block border border-green-500 rounded-full ring-2 ring-white ring-opacity-50"
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
  const target = sender?.toLowerCase().trim() || "";

  if (target === "pay") return avatar.default;

  let bestMatch = { key: null, distance: Infinity };

  candidates.forEach((key) => {
    const keyLower = key.toLowerCase();

    const isSubstring = target.includes(keyLower);

    const distance = levenshtein.get(target, keyLower);

    const isPriorityKey = ["hdfc", "icic", "sbi", "amazon", "kotak", "sbi", "canbnk"].includes(
      keyLower
    );

    if (isSubstring && isPriorityKey) {
      bestMatch = { key, distance: 0 };
    } else if (distance < bestMatch.distance) {
      bestMatch = { key, distance: distance };
    }
  });

  return bestMatch.distance === 0 || bestMatch.distance < 3
    ? avatar[bestMatch.key]
    : avatar.default;
};
