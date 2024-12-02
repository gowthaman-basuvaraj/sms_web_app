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
    readChats: JSON.parse(localStorage.getItem("readChats")) || [],
  });

  const { selectedChat } = useSelector((state) => state.auth);

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
        return {
          ...prevState,
          chats: [newMessage, ...updatedChats],
          loading: false,
          error: null,
        };
      });

      // Play notification sound
      if (!selectedChat.mute) {
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
  }, [handleSelectChat]);

  const markAsRead = (chatId) => {
    setState((prevState) => {
      const updatedReadChats = [...prevState.readChats, chatId];
      localStorage.setItem("readChats", JSON.stringify(updatedReadChats));
      return {
        ...prevState,
        readChats: updatedReadChats,
      };
    });
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