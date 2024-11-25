import { useState, useEffect } from "react";
import ChatList from "./Component/ChatList";
import ChatDetails from "./Component/ChatDetails";
import io from "socket.io-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  const [state, setState] = useState({
    selectedChat: null,
    chats: [],
    socket: null,
  });

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const socketInstance = io("http://localhost:3000");
    setState((prevState) => ({ ...prevState, socket: socketInstance }));

    socketInstance.on("newMessage", (newMessage) => {
      setState((prevState) => {
        const updatedChats = prevState.chats.filter(
          (chat) => chat.sender !== newMessage.sender
        );
        return { ...prevState, chats: [newMessage, ...updatedChats] };
      });

      // Show desktop notification
      if (Notification.permission === "granted") {
        const notification = new Notification("New message received", {
          body: `${newMessage.sender}: ${newMessage.text}`,
        });

        notification.onclick = () => {
          setState((prevState) => ({ ...prevState, selectedChat: newMessage }));
          window.focus();
        };
      }

      // Play notification sound
      const audio = new Audio("/sound.mp3");
      audio.play();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleSelectChat = (chat) => {
    setState((prevState) => ({ ...prevState, selectedChat: chat }));
  };

  return (
    <Router>
      <div className="flex h-screen">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <ChatList
                  chats={state.chats}
                  onSelectChat={handleSelectChat}
                  socket={state.socket}
                />
                <ChatDetails chat={state.selectedChat} socket={state.socket} />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;