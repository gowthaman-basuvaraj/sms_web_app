import ChatList from "./ChatList";
import ChatDetails from "./ChatDetails";
import { useDispatch, useSelector } from "react-redux";
import { setImageURL, setSelectedChat, fetchUserPreferences } from "../store/Store";

export default function Chat() {
  const dispatch = useDispatch();
  const { user, selectedChat } = useSelector((state) => state.auth);

  const handleSelectChat = (chat, imageURL) => {
    dispatch(setSelectedChat(chat));
    dispatch(setImageURL(imageURL));
    dispatch(fetchUserPreferences({ userName: user.name, sender: chat.sender }));
  };

  const hasSelection = Boolean(selectedChat && selectedChat.id !== 0);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* List: full width on mobile (hidden once a chat is open); fixed sidebar on md+. */}
      <div
        className={`${
          hasSelection ? "hidden" : "flex"
        } w-full md:flex md:w-[360px] md:flex-shrink-0 md:border-r md:border-gray-700`}
      >
        <ChatList onSelectChat={handleSelectChat} />
      </div>

      {/* Details: shown on mobile only when a chat is open; always shown on md+. */}
      <div className={`${hasSelection ? "flex" : "hidden"} md:flex flex-1 min-w-0`}>
        <ChatDetails />
      </div>
    </div>
  );
}
