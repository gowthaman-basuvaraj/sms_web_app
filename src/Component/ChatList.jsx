import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaSearch } from "react-icons/fa";
import Loader from "./Loader";
import { useSocket } from "./SocketProvider";

const ChatList = ({ onSelectChat }) => {
  const { chats, loading, error } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-4"><Loader /></div>;
  }

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="w-1/3 border-r h-[90vh] border-gray-300 overflow-y-auto flex flex-col justify-between p-1">
      <div className="">
        <div className="relative p-4 flex items-center">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full py-2 pl-10 border border-gray-300 rounded"
          />
          <FaSearch className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        {filteredChats.length === 0 ? (
          <div className="p-4">No chats available</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="p-4 cursor-pointer hover:bg-gray-100"
            >
              <strong>{chat.sender}</strong>: {chat.text}
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