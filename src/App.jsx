import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Component/Navbar";
import { SocketProvider } from "./Component/SocketProvider";
import { HandleAccess } from "./store/AccessHandle";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat, fetchAllSenderMutePreferences } from "./store/Store";
import Chat from "./Component/Chat";
import { useEffect } from "react";

const App = () => {
  const dispatch = useDispatch();

  const { haveAccess, user } = useSelector((state) => state.auth);

  const handleSelectChat = (chat, imageURL) => {
    dispatch(setSelectedChat(chat));
    dispatch(setImageURL(imageURL));
  };

  useEffect(() => {
    console.log("User:", user);
    dispatch(fetchAllSenderMutePreferences(user.name));
  }, [user]);

  return (
    <SocketProvider handleSelectChat={handleSelectChat}>
      <Router>
        <HandleAccess />
        <div className="flex flex-col h-screen">
          <Navbar />
          <div className="flex flex-grow">
            <Routes>
              {haveAccess ? (
                <Route path="/" element={<Chat />} />
              ) : (
                <Route
                  path="*"
                  element={
                    <div className="flex justify-center items-center h-screen bg-gray-800 text-white w-full">
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
