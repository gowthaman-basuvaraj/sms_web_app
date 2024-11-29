import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaSearch } from "react-icons/fa";
import { useSocket } from "./SocketProvider";
import { IoCloseSharp } from "react-icons/io5";
import Avatar from "../UI/Avatar";

const ChatDetails = ({ chat, onCloseChat }) => {
  const { socket } = useSocket();
  const [state, setState] = useState({
    messages: [],
    error: null,
    searchQuery: "",
  });

  useEffect(() => {
    if (!chat) {
      setState({ messages: [], error: null });
      return;
    }

    const fetchMessages = async () => {
      setState({ messages: [], error: null });
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/messages?sender=${chat.sender}`
        );
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.messages)) {
          setState({ messages: data.messages, error: null });
        } else {
          throw new Error("Unexpected data format");
        }
      } catch (error) {
        setState({
          messages: [],
          error: "Failed to fetch messages",
        });
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();

    if (socket) {
      const handleNewMessage = (newMessage) => {
        if (newMessage.sender === chat.sender) {
          setState((prevState) => ({
            messages: [...prevState.messages, newMessage],
            error: null,
          }));
        }
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [chat, socket]);

  const handleSearchChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      searchQuery: event.target.value,
    }));
  };

  const filteredChats = state.messages.filter((msg) => {
    const simMatch = msg.sim
      ?.toLowerCase()
      .includes(state.searchQuery?.toLowerCase());
    const textMatch = msg.text
      ?.toLowerCase()
      .includes(state.searchQuery?.toLowerCase());
    return simMatch || textMatch;
  });

  const handleChatClose = () => {
    setState((prev) => ({
      ...prev,
      messages: [],
    }));
    onCloseChat();
  };

  const { error } = state;

  if (!chat) {
    return (
      <div className="p-4 flex flex-col w-full h-[90vh] md:w-2/3 font-bold items-center">
        Select a chat to view details !
      </div>
    );
  }

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="p-4 flex flex-col w-full h-[90vh] md:w-2/3">
      <div className="flex justify-between items-center bg-green-200 p-2">
        <div className="flex gap-2 items-center">
          <Avatar
            imageURL={localStorage.getItem("imageURL")}
            sender={chat.sender}
          />
          <h2 className="text-2xl font-bold sticky">{chat.sender}</h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search messages..."
              value={state.searchQuery}
              onChange={handleSearchChange}
              className="w-full py-2 pl-16 border border-gray-300 rounded"
            />
            <FaSearch className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <div
            className="cursor-pointer p-2 hover:text-red-600"
            onClick={handleChatClose}
          >
            <IoCloseSharp className="font-bold text-3xl" />
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 bg-green-100 ">
        {state.searchQuery?.length > 0 ? (
          filteredChats.length === 0 ? (
            <div className="mt-2 text-gray-600 text-center">
              No messages found matching the search query.
            </div>
          ) : (
            filteredChats.map((message) => (
              <div
                key={message.id}
                className={`mt-3 p-3 rounded-lg shadow-md max-w-[75%] ${
                  message.sender === "me" ? "bg-green-100 self-end" : "bg-white"
                }`}
              >
                <p className="text-lg">{message.text}</p>
                {message.sim && (
                  <p className="text-md text-black mt-1">
                    <strong>SIM:</strong> {message.sim}
                  </p>
                )}
                {message.sentStamp && (
                  <p className="text-md  mt-1 text-right">
                    {message.sentStamp}
                  </p>
                )}
              </div>
            ))
          )
        ) : (
          state.messages.map((message) => (
            <div
              key={message.id}
              className={`mt-2 p-3 rounded-lg shadow-md max-w-[75%] ${
                message.sender === "me" ? "bg-green-100 self-end" : "bg-white"
              }`}
            >
              <p className="text-lg">{message.text}</p>
              {message.sim && (
                <p className="text-md text-black mt-1">
                  <strong>SIM:</strong> {message.sim}
                </p>
              )}
              {message.sentStamp && (
                <p className="text-md  mt-1 text-right">{message.sentStamp}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ChatDetails.propTypes = {
  chat: PropTypes.shape({
    sender: PropTypes.string.isRequired,
    text: PropTypes.string,
    sim: PropTypes.string,
    sentStamp: PropTypes.string,
  }),
  onCloseChat: PropTypes.func.isRequired,
  imageURL: PropTypes.string,
};

export default ChatDetails;