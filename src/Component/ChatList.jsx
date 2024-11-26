import { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import AuthContext from "../store/Auth";
import { FaSearch } from "react-icons/fa";

const ChatList = ({ onSelectChat, socket }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
    searchQuery: "",
  });
  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/messages/recent`
        );
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.messages)) {
          setState((prevState) => ({
            ...prevState,
            chats: data.messages,
            loading: false,
            error: null,
          }));
        } else {
          throw new Error("Unexpected data format");
        }
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          chats: [],
          loading: false,
          error: "Failed to fetch chats",
        }));
        console.error(error);
      }
    };

    fetchChats();

    if (socket) {
      socket.on("newMessage", (newMessage) => {
        setState((prevState) => {
          const updatedChats = prevState.chats.filter(
            (chat) => chat.sender !== newMessage.sender
          );
          return {
            ...prevState,
            chats: [newMessage, ...updatedChats],
            loading: false,
            error: null,
          };
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("newMessage");
      }
    };
  }, [socket]);

  const handleSearchChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      searchQuery: event.target.value,
    }));
  };

  const filteredChats = state.chats.filter(
    (chat) =>
      chat.sender.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      chat.text.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (state.loading) {
    return <div className="p-4">Loading chats...</div>;
  }

  if (state.error) {
    return <div className="p-4">{state.error}</div>;
  }

  return (
    <div className="w-1/3 border-r border-gray-300 overflow-y-scroll h-full flex flex-col justify-between p-3">
      <div className="">
        <div className="relative p-4 flex items-center">
          <input
            type="text"
            placeholder="Search chats..."
            value={state.searchQuery}
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
      <button
        className="border-2 p-2 rounded-md bg-black text-white font-semibold place-content-end"
        onClick={() => keycloak.logout()}
      >
        Logout
      </button>
    </div>
  );
};

ChatList.propTypes = {
  onSelectChat: PropTypes.func.isRequired,
  socket: PropTypes.object,
};

export default ChatList;
