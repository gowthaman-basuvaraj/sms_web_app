import PropTypes from "prop-types";

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
}

Avatar.propTypes = {
    imageURL: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
}

export default Avatar;
