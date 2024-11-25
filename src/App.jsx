import { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatDetails from './ChatDeatils';
import io from 'socket.io-client';

const App = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const socketInstance = io('http://localhost:3000');
    setSocket(socketInstance);

    socketInstance.on('newMessage', (newMessage) => {
      setChats((prevChats) => {
        const updatedChats = prevChats.filter(chat => chat.sender !== newMessage.sender);
        return [newMessage, ...updatedChats];
      });

      // Show desktop notification
      if (Notification.permission === 'granted') {
        const notification = new Notification('New message received', {
          body: `${newMessage.sender}: ${newMessage.text}`,
        });

        notification.onclick = () => {
          setSelectedChat(newMessage);
          window.focus();
        };
      }

      // Play notification sound
      const audio = new Audio('/sound.mp3');
      audio.play();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen">
      <ChatList chats={chats} onSelectChat={setSelectedChat} socket={socket} />
      <ChatDetails chat={selectedChat} socket={socket} />
    </div>
  );
};

export default App;