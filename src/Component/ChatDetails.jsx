import { useEffect, useRef, useState } from "react";
import { FaSearch, FaClipboard, FaClipboardCheck } from "react-icons/fa";
import { useSocket } from "./SocketProvider";
import { IoCloseSharp, IoArrowBack } from "react-icons/io5";
import Avatar from "../UI/Avatar";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat } from "../store/Store";
import Toggle from "../UI/Toggle";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../lib/api";
import { formatStamp } from "../lib/time";
import Linkify from "../UI/Linkify";

const PAGE_SIZE = 100;

const ChatDetails = () => {
  const { socket } = useSocket();
  const { selectedChat, imageURL } = useSelector((state) => state.auth);

  const [state, setState] = useState({
    messages: [],
    error: null,
    searchQuery: "",
    copiedOTPMessageId: null,
    isLoading: false,
    hasMore: false,
    loadingMore: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loadedSenderRef = useRef(null);
  const loadingMoreRef = useRef(false);

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
    navigate("/");
  };

  useEffect(() => {
    if (!selectedChat) {
      setState((prevState) => ({
        ...prevState,
        messages: [],
        error: null,
        copiedOTPMessageId: null,
      }));
      return;
    }

    const fetchMessages = async () => {
      const senderChanged = loadedSenderRef.current !== selectedChat.sender;
      loadedSenderRef.current = selectedChat.sender;
      loadingMoreRef.current = false;
      // On a real sender switch, clear so we never show the previous sender's messages.
      // On a same-sender refresh, keep them until the new ones arrive (no blank). Either
      // way isLoading suppresses the "Not found" placeholder during the brief swap.
      setState((prevState) => ({
        ...prevState,
        messages: senderChanged ? [] : prevState.messages,
        error: null,
        copiedOTPMessageId: null,
        isLoading: true,
        hasMore: false,
      }));
      try {
        const response = await authFetch(
          `/messages?sender=${encodeURIComponent(selectedChat.sender)}&limit=${PAGE_SIZE}`
        );
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.messages)) {
          setState((prevState) => ({
            ...prevState,
            messages: data.messages,
            error: null,
            copiedOTPMessageId: null,
            isLoading: false,
            hasMore: data.messages.length === PAGE_SIZE,
          }));
        } else {
          throw new Error("Unexpected data format");
        }
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          messages: [],
          error: "Failed to fetch messages",
          copiedOTPMessageId: null,
          isLoading: false,
        }));
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();

    if (socket) {
      const handleNewMessage = (newMessage) => {
        if (newMessage.sender === selectedChat.sender) {
          // Newest first (top).
          setState((prevState) => ({
            ...prevState,
            messages: [newMessage, ...prevState.messages],
            error: null,
            copiedOTPMessageId: null,
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

  // Fetch the next older page (messages are newest-first, so older ones append at the end).
  const loadOlder = async () => {
    if (loadingMoreRef.current || !state.hasMore) return;
    const oldest = state.messages[state.messages.length - 1];
    if (!oldest?.id) return;
    loadingMoreRef.current = true;
    setState((p) => ({ ...p, loadingMore: true }));
    try {
      const res = await authFetch(
        `/messages?sender=${encodeURIComponent(selectedChat.sender)}&limit=${PAGE_SIZE}&before=${oldest.id}`
      );
      const data = await res.json();
      const older = Array.isArray(data.messages) ? data.messages : [];
      setState((p) => ({
        ...p,
        messages: [...p.messages, ...older],
        hasMore: older.length === PAGE_SIZE,
        loadingMore: false,
      }));
    } catch (err) {
      console.error("Failed to load older messages:", err);
      setState((p) => ({ ...p, loadingMore: false }));
    } finally {
      loadingMoreRef.current = false;
    }
  };

  const handleScroll = (event) => {
    if (state.searchQuery || !state.hasMore || loadingMoreRef.current) return;
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) loadOlder();
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
    setState((prevState) => ({
      ...prevState,
      messages: [],
      copiedOTPMessageId: null,
    }));
    handleOnCloseChat();
  };

  const copyToClipboard = (text, messageId) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log("Copied to clipboard:", text);
        setState((prevState) => ({
          ...prevState,
          copiedOTPMessageId: messageId,
        }));
        setTimeout(() => {
          setState((prevState) => ({
            ...prevState,
            copiedOTPMessageId: null,
          }));
        }, 2000); // Clear after 2 sec
      },
      (err) => {
        console.error("Failed to copy text to clipboard:", err);
      }
    );
  };

  const extractOTP = (text) => {
    const otpMatch = text.match(/\b\d{4,8}\b/);
    if (otpMatch) {
      // Check if the message contains typical OTP keywords
      const otpKeywords = ["otp", "one-time password", "verification code", "the verification code"];
      const lowerText = text.toLowerCase();
      if (otpKeywords.some((keyword) => lowerText.includes(keyword))) {
        return otpMatch[0];
      }
    }
    return null;
  };

  const { error } = state;

  if (selectedChat.id === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-bold text-white bg-gray-900">
        Select a chat to view details!
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-white bg-gray-900">{error}</div>;
  }

  const messagesToDisplay = state.searchQuery ? filteredChats : state.messages;

  return (
    <>
      {selectedChat.id !== 0 && (
        <div className="flex flex-col w-full h-full bg-gray-900 text-white">
          <div className="flex items-center gap-2 bg-gray-800 p-2">
            {/* Back to the list (mobile only). */}
            <button
              className="md:hidden shrink-0 p-1 text-white"
              onClick={handleChatClose}
              aria-label="Back"
            >
              <IoArrowBack className="text-2xl" />
            </button>
            <Avatar imageURL={imageURL} sender={selectedChat.sender} />
            <h2 className="flex-1 min-w-0 truncate text-lg md:text-2xl font-bold">
              {selectedChat.sender}
            </h2>
            <div className="relative hidden sm:flex items-center shrink">
              <input
                type="text"
                placeholder="Search..."
                value={state.searchQuery}
                onChange={handleSearchChange}
                className="w-40 md:w-56 py-2 pl-8 border border-gray-600 rounded bg-gray-700 text-white"
              />
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="shrink-0">
              <Toggle />
            </div>
            {/* Close (desktop only; mobile uses the back arrow). */}
            <button
              className="hidden md:block shrink-0 cursor-pointer p-2 hover:text-red-600"
              onClick={handleChatClose}
              aria-label="Close"
            >
              <IoCloseSharp className="font-bold text-3xl" />
            </button>
          </div>
          <div
            className="flex-grow min-h-0 overflow-y-auto p-4 bg-gray-800"
            onScroll={handleScroll}
          >
            {messagesToDisplay.length === 0 ? (
              state.isLoading ? null : (
                <div className="mt-2 text-lg font-bold text-center">
                  Not found
                </div>
              )
            ) : (
              messagesToDisplay.map((message) => {
                const otp = extractOTP(message.text);
                return (
                  <div
                    key={message.id}
                    className={`animate-fade-in mt-2 p-3 rounded-lg shadow-md w-full ${
                      message.sender === "me"
                        ? "bg-gray-700 self-end"
                        : "bg-gray-900"
                    }`}
                  >
                    {message.sentStamp && (
                      <p className="text-md mb-1 text-right text-white">
                        {formatStamp(message.sentStamp)}
                      </p>
                    )}
                    <p className="text-lg">
                      <Linkify text={message.text} />
                    </p>
                    {message.sim && (
                      <p className="text-md text-gray-300 mt-1">
                        <strong>SIM:</strong> {message.sim}
                      </p>
                    )}
                    {otp && (
                      <button
                        onClick={() => copyToClipboard(otp, message.id)}
                        className="mt-2 bg-gray-700 text-white px-2 py-1 rounded flex items-center"
                      >
                        {state.copiedOTPMessageId === message.id ? (
                          <>
                            <FaClipboardCheck className="mr-2" />
                            OTP Copied
                          </>
                        ) : (
                          <>
                            <FaClipboard className="mr-2" />
                            Copy OTP
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Load older messages (they append below, since newest is on top). */}
            {!state.searchQuery && state.hasMore && (
              <div className="py-3 text-center">
                <button
                  onClick={loadOlder}
                  disabled={state.loadingMore}
                  className="text-sm text-gray-300 hover:text-white disabled:opacity-50"
                >
                  {state.loadingMore ? "Loading…" : "Load older messages"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatDetails;