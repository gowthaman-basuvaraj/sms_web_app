import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaSearch } from "react-icons/fa";
import Loader from "./Loader";
import { useSocket } from "./SocketProvider";
import Avatar, { HandleAvatar } from "../UI/Avatar";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedChat, setImageURL } from "../store/Store";
import { useNavigate, useLocation } from "react-router-dom";

const ChatList = ({ onSelectChat }) => {
  const { chats, loading, error, markAsRead, unreadCount } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedChat } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get("chatId");
    const sender = params.get("sender");

    if (chatId && sender) {
      dispatch(setSelectedChat({ id: chatId, sender }));
      dispatch(setImageURL(HandleAvatar(sender)));
    }
  }, [location.search, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectChat = (chat, imageURL) => {
    markAsRead(chat.sender);
    onSelectChat(chat, imageURL);
    navigate(`?chatId=${chat.id}&sender=${chat.sender}`);
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
    <div className="w-full h-full overflow-hidden flex flex-col bg-gray-900 text-white">
      <div className="relative p-3 flex items-center bg-gray-800">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full py-2 pl-10 border border-gray-600 rounded bg-gray-700 text-white"
        />
        <FaSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="mt-2 text-lg font-bold text-center p-4">No results in chats</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat, HandleAvatar(chat.sender))}
              className={`p-3 flex items-center gap-3 cursor-pointer ${
                chat.id === selectedChat.id ? "bg-gray-700" : ""
              } hover:bg-gray-800`}
            >
              <Avatar imageURL={HandleAvatar(chat.sender)} sender={chat.sender} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate">{chat.sender}</strong>
                  {unreadCount[chat.sender] > 0 && (
                    <span className="shrink-0 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs">
                      {unreadCount[chat.sender]}
                    </span>
                  )}
                </div>
                <span className="block truncate text-sm text-gray-300">
                  {chat.text}
                </span>
              </div>
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