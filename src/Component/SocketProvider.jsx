import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import PropTypes from "prop-types";
import { HandleAvatar } from "../UI/Avatar";
import { useSelector } from "react-redux";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, handleSelectChat }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
    unreadCount: {},
  });

  const { mutePreferences, user, token } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/messages/recent`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, 
            },
          }
        );
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.messages)) {
          const unreadCount = data.messages.reduce((acc, message) => {
            acc[message.sender] = message.unreadCount;
            return acc;
          }, {});

          setState((prevState) => ({
            ...prevState,
            chats: data.messages,
            loading: false,
            error: null,
            unreadCount,
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
        console.error("Failed to fetch chats:", error);
      }
    };

    fetchChats();

    const socket = io(`${import.meta.env.VITE_BACKEND_API}`);

    socket.on("newMessage", (newMessage) => {
      setState((prevState) => {
        const updatedChats = prevState.chats.filter(
          (chat) => chat.sender !== newMessage.sender
        );
        const updatedUnreadCount = { ...prevState.unreadCount };
        if (!updatedUnreadCount[newMessage.sender]) {
          updatedUnreadCount[newMessage.sender] = 0;
        }
        updatedUnreadCount[newMessage.sender] += 1;

        return {
          ...prevState,
          chats: [newMessage, ...updatedChats],
          loading: false,
          error: null,
          unreadCount: updatedUnreadCount,
        };
      });

      const muteState = mutePreferences[user.name][newMessage.sender];
      console.log(
        "mute preference object in store:",
        mutePreferences[user.name][newMessage.sender]
      );

      if (!muteState) {
        // Play notification sound
        const audio = new Audio("/sound.mp3");
        audio.play();
      }

      // Show desktop notification
      if (Notification.permission === "granted") {
        const notification = new Notification("New message received", {
          body: `${newMessage.sender}: ${newMessage.text}`,
        });

        const imageURL = HandleAvatar(newMessage.sender);

        notification.onclick = () => {
          handleSelectChat(newMessage, imageURL);
          window.focus();
        };
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          const imageURL = HandleAvatar(newMessage.sender);
          if (permission === "granted") {
            const notification = new Notification("New message received", {
              body: `${newMessage.sender}: ${newMessage.text}`,
            });

            notification.onclick = () => {
              handleSelectChat(newMessage, imageURL);
              window.focus();
            };
          }
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [handleSelectChat, mutePreferences, user.name]);

  const markAsRead = async (sender) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API}/messages/mark-as-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender }),
      });
  
      // Update the unread count locally
      setState((prevState) => {
        const updatedChats = prevState.chats.map((chat) => {
          if (chat.sender === sender) {
            return { ...chat, isRead: true };
          }
          return chat;
        });
  
        const updatedUnreadCount = { ...prevState.unreadCount };
        updatedUnreadCount[sender] = 0;
  
        return {
          ...prevState,
          unreadCount: updatedUnreadCount,
          chats: updatedChats,
        };
      });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  return (
    <SocketContext.Provider value={{ ...state, markAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
  handleSelectChat: PropTypes.func.isRequired,
};
