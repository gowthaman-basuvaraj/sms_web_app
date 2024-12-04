import { useState } from "react";
import PropTypes from "prop-types";
import { FaSearch } from "react-icons/fa";
import Loader from "./Loader";
import { useSocket } from "./SocketProvider";
import Avatar, { HandleAvatar } from "../UI/Avatar";
import { useSelector } from "react-redux";

const ChatList = ({ onSelectChat }) => {
  const { chats, loading, error, markAsRead, unreadCount } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");

  const { selectedChat } = useSelector((state) => state.auth);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectChat = (chat, imageURL) => {
    markAsRead(chat.sender);
    onSelectChat(chat, imageURL);
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-white bg-gray-900">{error}</div>;
  }

  return (
    <div className="w-full border-r h-[90vh] border-gray-700 overflow-y-auto flex flex-col bg-gray-900 text-white">
      <div className="relative p-4 flex items-center bg-gray-800">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full py-2 pl-10 border border-gray-600 rounded bg-gray-700 text-white"
        />
        <FaSearch className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-gray-400">No chats available</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat, HandleAvatar(chat.sender))}
              className={`p-4 flex items-center cursor-pointer ${
                chat.id === selectedChat.id ? "bg-gray-700 rounded-md" : ""
              } hover:bg-gray-800`}
            >
              <Avatar imageURL={HandleAvatar(chat.sender)} sender={chat.sender} />
              <strong className="truncate w-1/4">{chat.sender}</strong>
              <span className="truncate w-4/5 ml-2">{chat.text}</span>
              {unreadCount[chat.sender] > 0 && (
                <span className="ml-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs">
                  {unreadCount[chat.sender]}
                </span>
              )}
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