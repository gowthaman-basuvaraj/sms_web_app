import { FaRegUserCircle } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import StatusIndicator from "./StatusIndicator";
import { Select, SelectContent, SelectTrigger } from "../UI/select";
import { useSelector } from "react-redux";
import { Logout } from "../store/Auth";
import { useDispatch } from "react-redux";
import {
  setToken,
  setRefreshToken,
  setUser,
  setHaveAccess,
} from "../store/Store";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    console.log("Attempting to log out...");
    const handleLoggingout = () => {
      dispatch(setToken(""));
      dispatch(setRefreshToken(""));
      dispatch(setUser({ name: "", role: "" }));
      dispatch(setHaveAccess(false));
      Logout();
    };
    handleLoggingout();
  };

  return (
    <nav className="bg-gray-950 text-white p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xl font-bold">SMS Web App</span>
          <div className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`
              }
            >
              Chats
            </NavLink>
            <NavLink
              to="/all"
              className={({ isActive }) =>
                `px-3 py-1 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`
              }
            >
              All
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator />
          <Select className="flex text-white justify-between gap-5">
            <SelectTrigger>
              <div className="flex items-center space-x-2 pr-3">
                <FaRegUserCircle className="h-6 w-6 text-white" />
                <span className="text-white">{user?.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="mt-4 bg-gray-700 text-white">
              <div className="px-3 cursor-default">
                <b>Role:</b> {user?.role}
              </div>
              <button
                className="w-full text-left py-2 px-3 text-white hover:bg-gray-600 rounded-md font-bold"
                onClick={handleLogout}
              >
                Logout
              </button>
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;