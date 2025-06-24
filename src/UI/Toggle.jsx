import { useSelector, useDispatch } from "react-redux";
import { updateMutePreference } from "../store/Store.js";
import { useState, useEffect } from "react";

const Toggle = () => {
  const dispatch = useDispatch();
  const { selectedChat, user, token } = useSelector((state) => state.auth);
  const [muteState, setmuteState] = useState(selectedChat.mute);

  useEffect(() => {
    setmuteState(selectedChat.mute);
  }, [selectedChat.mute]);

  const handleToggle = () => {
    const userName = user.name;
    const sender = selectedChat.sender;
    const newMuteState = !muteState; 
    setmuteState(newMuteState);
    dispatch(updateMutePreference({ userName, sender, mute: newMuteState, token   }));
  };

  return (
    <label className="flex items-center relative w-max cursor-pointer select-none">
      <input
        type="checkbox"
        checked={muteState}
        onChange={handleToggle}
        className={`appearance-none transition-colors cursor-pointer w-20 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 ${
          muteState ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span
        className={`absolute font-medium text-[8px] uppercase ${
          muteState ? "right-8" : "right-1"
        } text-white`}
      >
        {muteState ? "Muted" : "Not Muted"}
      </span>
      <span
        className={`w-7 h-7 absolute rounded-full transform transition-transform bg-gray-200 ${
          muteState ? "translate-x-14" : ""
        }`}
      />
    </label>
  );
};

export default Toggle;