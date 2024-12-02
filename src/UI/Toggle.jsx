import { useSelector, useDispatch } from "react-redux";
import {updateMutePreference} from "../store/Store.js"

const Toggle = () => {
  const dispatch = useDispatch();
  const { selectedChat, user } = useSelector((state) => state.auth);
  
  const handleToggle = () => {
    const userName = user.name;
    const sender = selectedChat.sender;
    const mute = !selectedChat.mute;
    dispatch(updateMutePreference({ userName, sender, mute }));
  };

  return (
    <label className="flex items-center relative w-max cursor-pointer select-none">
      <input
        type="checkbox"
        value={selectedChat.mute}
        onChange={handleToggle}
        className={`appearance-none transition-colors cursor-pointer w-20 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 ${
          selectedChat.mute ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span
        className={`absolute font-medium text-[8px] uppercase ${
          selectedChat.mute ? "right-8" : "right-1"
        } text-white`}
      >
        {selectedChat.mute ? "Muted" : "Not Muted"}
      </span>
      <span
        className={`w-7 h-7 absolute rounded-full transform transition-transform bg-gray-200 ${
          selectedChat.mute ? "translate-x-14" : ""
        }`}
      />
    </label>
  );
};

export default Toggle;
