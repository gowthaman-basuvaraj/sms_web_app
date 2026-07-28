import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./Component/Navbar";
import { SocketProvider } from "./Component/SocketProvider";
import { HandleAccess } from "./store/AccessHandle";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat, fetchAllSenderMutePreferences } from "./store/Store";
import Chat from "./Component/Chat";
import AllMessages from "./Component/AllMessages";
import SessionExpiredOverlay from "./Component/SessionExpiredOverlay";
import { useEffect } from "react";
import Loader from "./Component/Loader";

const App = () => {
  const dispatch = useDispatch();
  const { haveAccess, user, token } = useSelector((state) => state.auth);

  const handleSelectChat = (chat, imageURL) => {
    dispatch(setSelectedChat(chat));
    dispatch(setImageURL(imageURL));
  };

  // Load this user's mute preferences once we actually have a user + token.
  useEffect(() => {
    if (user?.name && token) {
      dispatch(fetchAllSenderMutePreferences({ userName: user.name, token }));
    }
  }, [user, token, dispatch]);

  // Until Keycloak authenticates (login-required redirects the page), show a loader
  // instead of briefly flashing the "no access" screen.
  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800 text-white w-full">
        <Loader />
      </div>
    );
  }

  return (
    <SocketProvider handleSelectChat={handleSelectChat}>
      <Router>
        <HandleAccess />
        <SessionExpiredOverlay />
        <div className="flex flex-col h-screen">
          <Navbar />
          <div className="flex flex-1 min-h-0">
            <Routes>
              {haveAccess ? (
                <>
                  <Route path="/" element={<Chat />} />
                  <Route path="/all" element={<AllMessages />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
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
