import { useState } from 'react';
import ChatList from './ChatList';
import ChatDetails from './ChatDeatils';

const App = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  console.log('App rendered')

  return (
    <div className="flex h-screen">
      <ChatList onSelectChat={setSelectedChat} />
      <ChatDetails chat={selectedChat} />
    </div>
  );
};

export default App;