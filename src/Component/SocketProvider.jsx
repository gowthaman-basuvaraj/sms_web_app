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
import { useSelector } from "react-redux";
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

  const { mutePreferences, user, token } = useSelector((state) => state.auth);

  // Keep the latest values available to the long-lived socket handler without
  // resubscribing (which would reconnect the socket on every store change).
  const muteRef = useRef(mutePreferences);
  const userRef = useRef(user);
  const handleSelectRef = useRef(handleSelectChat);
  muteRef.current = mutePreferences;
  userRef.current = user;
  handleSelectRef.current = handleSelectChat;

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

    return () => {
      activeSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [authed]);

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

  return (
    <SocketContext.Provider value={{ ...state, socket, connected, markAsRead }}>
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
