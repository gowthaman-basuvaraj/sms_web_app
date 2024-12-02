import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useSocket } from "./SocketProvider";
import { IoCloseSharp } from "react-icons/io5";
import Avatar from "../UI/Avatar";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat } from "../store/Store";
import Toggle from "../UI/Toggle";

const ChatDetails = () => {
  const { socket } = useSocket();
  const { selectedChat, imageURL } = useSelector((state) => state.auth);

  const [state, setState] = useState({
    messages: [],
    error: null,
    searchQuery: "",
  });

  const dispatch = useDispatch();

  const handleOnCloseChat = () => {
    dispatch(
      setSelectedChat({
        id: 0,
        sender: "",
        sim: "",
        mute: selectedChat.mute,
      })
    );
    dispatch(setImageURL(""));
  };

  useEffect(() => {
    if (!selectedChat) {
      setState({ messages: [], error: null });
      return;
    }

    const fetchMessages = async () => {
      setState({ messages: [], error: null });
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/messages?sender=${
            selectedChat.sender
          }`
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
        if (newMessage.sender === selectedChat.sender) {
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
  }, [selectedChat, socket]);

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
    handleOnCloseChat();
  };

  const { error } = state;

  if (selectedChat.id === 0) {
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
    <>
      {selectedChat.id !== 0 && (
        <div className="flex flex-col w-full h-[90vh] flex-wrap">
          <div className="flex justify-between items-center bg-green-200 p-2">
            <div className="flex gap-2 items-center">
              <Avatar imageURL={imageURL} sender={selectedChat.sender} />
              <h2 className="text-2xl font-bold sticky">
                {selectedChat.sender}
              </h2>
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
              {/* input type  radio in which true radio means mute else no mute */}
              <div className="">
                <Toggle />
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
                      message.sender === "me"
                        ? "bg-green-100 self-end"
                        : "bg-white"
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
                    message.sender === "me"
                      ? "bg-green-100 self-end"
                      : "bg-white"
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
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatDetails;
