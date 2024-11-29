import { useState } from "react";
import ChatList from "./ChatList";
import ChatDetails from "./ChatDetails";
import { useDispatch, useSelector } from "react-redux";
import { setImageURl, setSelectedChat } from "../store/Store";

export default function Chat() {
  const [state, setState] = useState({
    chatListWidth: 450,
  });
  const dispatch = useDispatch();

  const { imageURL, selectedChat } = useSelector((state) => state.auth);

  const handleSelectChat = (chat, imageURL) => {
    dispatch(setSelectedChat(chat.id));
    dispatch(setImageURl(imageURL));
  };

  const handleOnCloseChat = () => {
    dispatch(setSelectedChat(null));
    dispatch(setImageURl(null));
  };

  const handleResize = (e) => {
    const newWidth = Math.min(
      Math.max(200, e.clientX), // Minimum width is 200px
      window.innerWidth * 0.5 // Maximum width is 50% of the screen
    );
    setState((prevState) => ({
      ...prevState,
      chatListWidth: newWidth,
    }));
  };
  return (
    <>
      <div
        className="grid grid-cols-[auto_1fr] h-full"
        style={{
          gridTemplateColumns: `${state.chatListWidth}px 1fr`,
        }}
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
                document.removeEventListener("mousemove", handleResize)
              );
            }}
          ></div>
        </div>

        <div
          className="h-full"
          style={{
            width: `calc(100vw - ${state.chatListWidth}px)`,
          }}
        >
          <ChatDetails
            chat={selectedChat}
            imageURL={imageURL}
            onCloseChat={handleOnCloseChat}
          />
        </div>
      </div>
    </>
  );
}
