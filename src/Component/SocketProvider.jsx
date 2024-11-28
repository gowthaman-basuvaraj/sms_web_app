import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import PropTypes from "prop-types";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, handleSelectChat }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/messages/recent`
        );
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.messages)) {
          setState({ chats: data.messages, loading: false, error: null });
        } else {
          throw new Error("Unexpected data format");
        }
      } catch (error) {
        setState({ chats: [], loading: false, error: "Failed to fetch chats" });
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
          chats: [newMessage, ...updatedChats],
          loading: false,
          error: null,
        };
      });

      // Play notification sound
      const audio = new Audio("/sound.mp3");
      audio.play();

      // Show desktop notification
      if (Notification.permission === "granted") {
        const notification = new Notification("New message received", {
          body: `${newMessage.sender}: ${newMessage.text}`,
        });

        notification.onclick = () => {
          handleSelectChat(newMessage);
          window.focus();
        };
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            const notification = new Notification("New message received", {
              body: `${newMessage.sender}: ${newMessage.text}`,
            });

            notification.onclick = () => {
              handleSelectChat(newMessage);
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

  return (
    <SocketContext.Provider value={state}>{children}</SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
  handleSelectChat: PropTypes.func.isRequired,
};
