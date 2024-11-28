import { useState, useEffect } from "react";
import ChatList from "./Component/ChatList";
import ChatDetails from "./Component/ChatDetails";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Component/Navbar";
import { SocketProvider } from "./Component/SocketProvider";
import { handleAccess } from "./store/AccessHandle";

const App = () => {
  const [state, setState] = useState({
    selectedChat: null,
    haveAccess: false,
    imageURL: null,
    user: {
      name: "",
      role: "",
    },
  });

  const handleSelectChat = (chat, imageURL) => {
    setState((prevState) => ({
      ...prevState,
      selectedChat: chat,
      imageURL: imageURL,
    }));
    localStorage.setItem("selectedChat", chat.id);
  };

  const handleOnCloseChat = () => {
    setState((prevState) => ({ ...prevState, selectedChat: null, imageURL: null }));
    localStorage.setItem("selectedChat", null);
  };

  useEffect(() => {
    handleAccess(setState);
  }, []);

  return (
    <SocketProvider handleSelectChat={handleSelectChat}>
      <Router>
        <div className="flex flex-col h-screen">
          <Navbar />
          <div className="flex flex-grow">
            <Routes>
              {state.haveAccess ? (
                <Route
                  path="/"
                  element={
                    <>
                      <ChatList onSelectChat={handleSelectChat} />
                      <ChatDetails
                        chat={state.selectedChat}
                        imageURL={state.imageURL}
                        onCloseChat={handleOnCloseChat}
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
    </SocketProvider>
  );
};

export default App;
