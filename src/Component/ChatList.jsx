import { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import AuthContext from "../store/Auth";

const ChatList = ({ onSelectChat, socket }) => {
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
    searchQuery: '',
  });
  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/messages/recent`);
        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.messages)) {
          setState((prevState) => ({
            ...prevState,
            chats: data.messages,
            loading: false,
            error: null,
          }));
        } else {
          throw new Error('Unexpected data format');
        }
      } catch (error) {
        setState((prevState) => ({
          ...prevState,
          chats: [],
          loading: false,
          error: 'Failed to fetch chats',
        }));
        console.error(error);
      }
    };

    fetchChats();

    if (socket) {
      socket.on('newMessage', (newMessage) => {
        setState((prevState) => {
          const updatedChats = prevState.chats.filter(chat => chat.sender !== newMessage.sender);
          return {
            ...prevState,
            chats: [newMessage, ...updatedChats],
            loading: false,
            error: null,
          };
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [socket]);

  const handleSearchChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      searchQuery: event.target.value,
    }));
  };

  const filteredChats = state.chats.filter(chat =>
    chat.sender.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    chat.text.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (state.loading) {
    return <div className="p-4">Loading chats...</div>;
  }

  if (state.error) {
    return <div className="p-4">{state.error}</div>;
  }

  return (
    <div className="w-1/3 border-r border-gray-300 overflow-y-scroll h-full">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search chats..."
          value={state.searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      {filteredChats.length === 0 ? (
        <div className="p-4">No chats available</div>
      ) : (
        filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-4 cursor-pointer hover:bg-gray-100"
          >
            <strong>{chat.sender}</strong>: {chat.text}
          </div>
        ))
      )}
      <button onClick={() => keycloak.logout()}>Logout</button>
    </div>
  );
};

ChatList.propTypes = {
  onSelectChat: PropTypes.func.isRequired,
  socket: PropTypes.object,
};

export default ChatList;