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
    chatListWidth: 450,
  });

  const handleSelectChat = (chat, imageURL) => {
    setState((prevState) => ({
      ...prevState,
      selectedChat: chat,
      imageURL: imageURL,
    }));
    localStorage.setItem("selectedChat", chat.id);
    localStorage.setItem("imageURL", imageURL);
  };

  const handleOnCloseChat = () => {
    setState((prevState) => ({
      ...prevState,
      selectedChat: null,
      imageURL: null,
    }));
    localStorage.setItem("selectedChat", null);
    localStorage.setItem("imageURL", null);
  };

  const handleResize = (e) => {
    const newWidth = Math.min(
      Math.max(200, e.clientX), // Minimum width is 200px
      window.innerWidth * 0.5 // Maximum width is 50% of the screen
    );
    setState((prevState)=>({
      ...prevState,
      chatListWidth: newWidth,
    })) 
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
                    <div
                      className="grid grid-cols-[auto_1fr] h-full"
                      style={{ gridTemplateColumns: `${state.chatListWidth}px 1fr` }}
                    >
                      {/* Chat List */}
                      <div className="relative h-full">
                        <ChatList onSelectChat={handleSelectChat} />
                        <div
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.addEventListener("mousemove", handleResize);
                            document.addEventListener("mouseup", () =>
                              document.removeEventListener(
                                "mousemove",
                                handleResize
                              )
                            );
                          }}
                        ></div>
                      </div>

                      <div className="h-full" style={{
                          width: `calc(100vw - ${state.chatListWidth}px)`,
                        }}>
                        <ChatDetails
                          chat={state.selectedChat}
                          imageURL={state.imageURL}
                          onCloseChat={handleOnCloseChat}
                        />
                      </div>
                    </div>
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