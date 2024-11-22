import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

const ChatList = ({ onSelectChat }) => {
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
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const { chats, loading, error } = state;

  if (loading) {
    return <div className="p-4">Loading chats...</div>;
  }

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="w-1/3 border-r border-gray-300 overflow-y-scroll h-full">
      {chats.length === 0 ? (
        <div className="p-4">No chats available</div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-4 cursor-pointer hover:bg-gray-100"
          >
            <strong>{chat.sender}</strong>: {chat.text}
          </div>
        ))
      )}
    </div>
  );
};

ChatList.propTypes = {
  onSelectChat: PropTypes.func.isRequired,
};

export default ChatList;