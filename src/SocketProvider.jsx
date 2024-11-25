import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/messages/recent');
        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.messages)) {
          setState({ chats: data.messages, loading: false, error: null });
        } else {
          throw new Error('Unexpected data format');
        }
      } catch (error) {
        setState({ chats: [], loading: false, error: 'Failed to fetch chats' });
      }
    };

    fetchChats();

    const socket = io('http://localhost:3000');

    socket.on('newMessage', (newMessage) => {
      setState((prevState) => {
        const updatedChats = prevState.chats.filter(chat => chat.sender !== newMessage.sender);
        return {
          chats: [newMessage, ...updatedChats],
          loading: false,
          error: null,
        };
      });

      const audio = new Audio('/sound.mp3');
      audio.play();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={state}>
      {children}
    </SocketContext.Provider>
  );
};