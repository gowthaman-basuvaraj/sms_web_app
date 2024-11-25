import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ChatDetails = ({ chat, socket }) => {
  const [state, setState] = useState({
    messages: [],
    error: null,
  });

  useEffect(() => {
    if (!chat) {
      setState({ messages: [], error: null });
      return;
    }

    const fetchMessages = async () => {
      setState({ messages: [], error: null });
      try {
        const response = await fetch(`http://localhost:3000/messages?sender=${chat.sender}`);
        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.messages)) {
          setState({ messages: data.messages, error: null });
        } else {
          throw new Error('Unexpected data format');
        }
      } catch (error) {
        setState({ 
          messages: [], 
          error: 'Failed to fetch messages'
          });
      }
    };

    fetchMessages();

    if (socket) {
      socket.on('newMessage', (newMessage) => {
        if (newMessage.sender === chat.sender) {
          setState((prevState) => ({
            messages: [...prevState.messages, newMessage],
            error: null,
          }));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [chat, socket]);

  const { messages, error } = state;

  if (!chat) {
    return <div className="p-4">Select a chat to view details</div>;
  }

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">{chat.sender}</h2>
      <div className="flex-grow overflow-y-auto pr-4">
        {messages.length === 0 ? (
          <div className="mt-2">No messages available</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="mt-2 p-3 bg-gray-100 rounded-lg shadow-md">
              <p className="text-lg">{message.text}</p>
              <p className="text-sm text-gray-600"><strong>SIM:</strong> {message.sim}</p>
              <p className="text-sm text-gray-600"><strong>Sent:</strong> {message.sentStamp}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ChatDetails.propTypes = {
  chat: PropTypes.shape({
    sender: PropTypes.string.isRequired,
    text: PropTypes.string,
    sim: PropTypes.string,
    sentStamp: PropTypes.string,
  }),
  socket: PropTypes.object,
};

export default ChatDetails;