import { useState, useEffect } from "react";
import ChatList from "./Component/ChatList";
import ChatDetails from "./Component/ChatDetails";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "./Component/Navbar";
import { SocketProvider } from "./Component/SocketProvider";

const App = () => {
  const [state, setState] = useState({
    selectedChat: null,
    haveAccess: false,
    user: {
      name: "",
      role: "",
    },
  });

  const handleSelectChat = (chat) => {
    setState((prevState) => ({ ...prevState, selectedChat: chat }));
  };

  const handleAccess = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token not found in localStorage");
      return;
    }

    const decodedToken = jwtDecode(token || "");
    const user = {
      name: decodedToken.preferred_username,
      role: decodedToken.realm_access.roles.includes(
        import.meta.env.VITE_REALM_ACCESS
      )
        ? import.meta.env.VITE_REALM_ACCESS
        : "",
    };
    localStorage.setItem("user", JSON.stringify(user));

    console.log("Decoded token:", decodedToken);

    setState((prev) => ({
      ...prev,
      haveAccess: decodedToken.realm_access.roles.includes(
        import.meta.env.VITE_REALM_ACCESS
      )
        ? true
        : false,
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
    <SocketProvider>
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
                      <ChatList onSelectChat={handleSelectChat} />
                      <ChatDetails chat={state.selectedChat} />
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
    </SocketProvider>
  );
};

export default App;