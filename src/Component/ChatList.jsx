import { useState } from "react";
import PropTypes from "prop-types";
import { FaSearch } from "react-icons/fa";
import Loader from "./Loader";
import { useSocket } from "./SocketProvider";
import Avatar from "../UI/Avatar";
import avatar from "../store/AvatarLogo";
import levenshtein from "fast-levenshtein";

const ChatList = ({ onSelectChat }) => {
  const { chats, loading, error } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectChat = (chat) => {
    onSelectChat(chat);
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAvatar = (sender) => {
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

    return bestMatch.key && bestMatch.score < 3
      ? avatar[bestMatch.key]
      : avatar.default;
  };

  if (loading) {
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="w-full md:w-1/3 border-r h-[90vh] border-gray-300 overflow-y-auto flex flex-col bg-white">
      <div className="relative p-4 flex items-center bg-gray-100">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full py-2 pl-10 border border-gray-300 rounded"
        />
        <FaSearch className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4">No chats available</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`p-4 flex items-center cursor-pointer ${
                chat.id == localStorage.getItem("selectedChat")
                  ? "bg-green-200 rounded-md"
                  : ""
              } hover:bg-green-100`}
            >
              <Avatar
                imageURL={handleAvatar(chat.sender)}
                sender={chat.sender}
              />
              <strong className="truncate w-1/4" >{chat.sender}</strong>
              <span className="truncate w-4/5 ml-2">{chat.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ChatList.propTypes = {
  onSelectChat: PropTypes.func.isRequired,
};

export default ChatList;
