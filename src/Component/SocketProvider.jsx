import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import PropTypes from "prop-types";
import { HandleAvatar } from "../UI/Avatar";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat } from "../store/Store";
import { authFetch } from "../lib/api";
import { keycloak } from "../lib/keycloak";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const API = import.meta.env.VITE_BACKEND_API;

export const SocketProvider = ({ children, handleSelectChat }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
    unreadCount: {},
  });
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const { mutePreferences, user, token, selectedChat } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  // Keep the latest values available to the long-lived socket handler without
  // resubscribing (which would reconnect the socket on every store change).
  const muteRef = useRef(mutePreferences);
  const userRef = useRef(user);
  const handleSelectRef = useRef(handleSelectChat);
  const selectedChatRef = useRef(selectedChat);
  muteRef.current = mutePreferences;
  userRef.current = user;
  handleSelectRef.current = handleSelectChat;
  selectedChatRef.current = selectedChat;

  // Drop a sender from the list locally, and close it if it's the open chat. Used both by
  // our own delete and by the server's "senderDeleted" broadcast (another client's delete).
  const removeSender = useRef((sender) => {
    setState((prev) => {
      const unreadCount = { ...prev.unreadCount };
      delete unreadCount[sender];
      return {
        ...prev,
        chats: prev.chats.filter((chat) => chat.sender !== sender),
        unreadCount,
      };
    });

    if (selectedChatRef.current?.sender === sender) {
      dispatch(setSelectedChat({ id: 0, sender: "", sim: "", mute: true }));
      dispatch(setImageURL(""));
    }
  }).current;

  const authed = Boolean(token);

  useEffect(() => {
    if (!authed) return;

    const fetchChats = async () => {
      try {
        const response = await authFetch("/messages/recent");
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.messages)) {
          const unreadCount = data.messages.reduce((acc, message) => {
            acc[message.sender] = message.unreadCount;
            return acc;
          }, {});
          setState((prev) => ({
            ...prev,
            chats: data.messages,
            loading: false,
            error: null,
            unreadCount,
          }));
        } else {
          throw new Error("Unexpected data format");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          chats: [],
          loading: false,
          error: "Failed to fetch chats",
        }));
        console.error("Failed to fetch chats:", error);
      }
    };

    fetchChats();

    // Connect once with a fresh token; the server authenticates the socket at the
    // handshake, so we don't reconnect on every token refresh.
    const activeSocket = io(API, { auth: { token: keycloak.token } });
    setSocket(activeSocket);
    setConnected(activeSocket.connected);
    activeSocket.on("connect", () => setConnected(true));
    activeSocket.on("disconnect", () => setConnected(false));
    activeSocket.on("connect_error", () => setConnected(false));

    activeSocket.on("newMessage", (newMessage) => {
      setState((prev) => {
        const updatedChats = prev.chats.filter(
          (chat) => chat.sender !== newMessage.sender
        );
        const updatedUnreadCount = { ...prev.unreadCount };
        updatedUnreadCount[newMessage.sender] =
          (updatedUnreadCount[newMessage.sender] || 0) + 1;
        return {
          ...prev,
          chats: [newMessage, ...updatedChats],
          loading: false,
          error: null,
          unreadCount: updatedUnreadCount,
        };
      });

      // Muted senders get no sound AND no desktop notification (this was the bug —
      // notify() used to run unconditionally). Default to muted when the preference
      // isn't loaded yet, matching the server's default.
      const muted =
        muteRef.current?.[userRef.current?.name]?.[newMessage.sender] ?? true;
      if (!muted) {
        new Audio("/sound.mp3").play().catch(() => {});
        notify(newMessage, handleSelectRef.current);
      }
    });

    activeSocket.on("senderDeleted", ({ sender }) => removeSender(sender));

    return () => {
      activeSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [authed, removeSender]); // removeSender is ref-stable; no reconnect churn

  const markAsRead = async (sender) => {
    try {
      await authFetch("/messages/mark-as-read", {
        method: "POST",
        body: JSON.stringify({ sender }),
      });
      setState((prev) => ({
        ...prev,
        unreadCount: { ...prev.unreadCount, [sender]: 0 },
        chats: prev.chats.map((chat) =>
          chat.sender === sender ? { ...chat, isRead: true } : chat
        ),
      }));
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Deletes the sender server-side (messages, mute preferences, retention rule). The
  // server broadcasts "senderDeleted", but we also update here so the caller sees it
  // immediately even if the socket is down.
  const deleteSender = async (sender) => {
    try {
      const res = await authFetch(`/sender?sender=${encodeURIComponent(sender)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to delete sender");
      }
      removeSender(sender);
      return true;
    } catch (error) {
      console.error("Failed to delete sender:", error);
      return false;
    }
  };

  return (
    <SocketContext.Provider
      value={{ ...state, socket, connected, markAsRead, deleteSender }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Shows a desktop notification, requesting permission on first use.
function notify(newMessage, onSelect) {
  const show = () => {
    const notification = new Notification("New message received", {
      body: `${newMessage.sender}: ${newMessage.text}`,
    });
    const imageURL = HandleAvatar(newMessage.sender);
    notification.onclick = () => {
      onSelect?.(newMessage, imageURL);
      window.focus();
    };
  };

  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") show();
    });
  }
}

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
  handleSelectChat: PropTypes.func.isRequired,
};
