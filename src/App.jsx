import { useState, useEffect } from "react";
import ChatList from "./Component/ChatList";
import ChatDetails from "./Component/ChatDetails";
import io from "socket.io-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "./Component/Navbar";
import { refreshToken } from "./store/Auth";

const App = () => {
  const [state, setState] = useState({
    selectedChat: null,
    chats: [],
    socket: null,
    haveAccess: false,
    user: {
      name: "",
      role: "",
    },
  });

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    } else {
      console.log("Notification permission already granted");
    }

    const socketInstance = io(`${import.meta.env.VITE_BACKEND_API}`);
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
        console.log("Showing notification for new message:", newMessage);
        const notification = new Notification("New message received", {
          body: `${newMessage.sender}: ${newMessage.text}`,
        });

        // Play notification sound
        const audio = new Audio("/sound.mp3");
        audio.play();

        notification.onclick = () => {
          setState((prevState) => ({ ...prevState, selectedChat: newMessage }));
          window.focus();
        };
      } else {
        console.log("Notification permission not granted");
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleSelectChat = (chat) => {
    setState((prevState) => ({ ...prevState, selectedChat: chat }));
  };

  const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  };

  const handleAccess = async () => {
    let token = localStorage.getItem("token");
    const refreshTokenValue = localStorage.getItem("refreshToken");

    if (!token || isTokenExpired(token)) {
      console.log("Access token expired, refreshing...");
      const tokens = await refreshToken(refreshTokenValue);

      if (!tokens) {
        console.error("Failed to refresh token, user cannot access");
        setState((prev) => ({ ...prev, haveAccess: false }));
        return;
      }

      token = tokens.accessToken;
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", tokens.refreshToken);
    }

    const decodedToken = jwtDecode(token);
    const user = {
      name: decodedToken.preferred_username,
      role: decodedToken.realm_access.roles.includes(
        import.meta.env.VITE_REALM_ACCESS
      )
        ? import.meta.env.VITE_REALM_ACCESS
        : "",
    };

    localStorage.setItem("user", JSON.stringify(user));

    setState((prev) => ({
      ...prev,
      haveAccess: decodedToken.realm_access.roles.includes(
        import.meta.env.VITE_REALM_ACCESS
      ),
      user,
    }));

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      console.log("User data:", user);
      if (!res.ok) {
        throw new Error("Failed to add user data");
      }
      console.log("User data added successfully to the database");
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };

  useEffect(() => {
    handleAccess();
  }, []);

  return (
    <Router>
      <div className="flex flex-col">
        <Navbar />
        <div className="flex">
          <Routes>
            {state.haveAccess ? (
              <Route
                path="/"
                element={
                  <>
                    <ChatList
                      chats={state.chats}
                      onSelectChat={handleSelectChat}
                      socket={state.socket}
                    />
                    <ChatDetails
                      chat={state.selectedChat}
                      socket={state.socket}
                    />
                  </>
                }
              />
            ) : (
              <Route
                path="*"
                element={
                  <div className="flex justify-center items-center h-screen">
                    <h1>You do not have access to read the SMS</h1>
                  </div>
                }
              />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
