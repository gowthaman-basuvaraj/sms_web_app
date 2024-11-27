import { FaRegUserCircle } from "react-icons/fa";
import { Select, SelectContent, SelectTrigger } from "../UI/select";
import AuthContext from "../store/Auth";
import { useContext } from "react";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const { keycloak } = useContext(AuthContext);

  const handleLogout = () => {
    console.log("Attempting to log out...");
    if (keycloak) {
      console.log("Logging out...");
      keycloak
        .logout()
        .then(() => {
          console.log("Logout successful");
        })
        .catch((error) => {
          console.error("Logout failed:", error);
        });
    } else {
      console.error("Keycloak instance not found");
    }
  };

  return (
    <nav className="bg-black text-white p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">SMS-Web-App</span>
        </div>
        <div className="flex items-center space-x-2">
          <Select className="flex text-white justify-between gap-5">
            <SelectTrigger>
              <div className="flex items-center space-x-2 pr-3">
                <FaRegUserCircle className="h-6 w-6 text-white" />
                <span className="text-white">{user?.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="mt-4 bg-white">
              <div className="px-3 cursor-default">
                <b>Role:</b> {user?.role}
              </div>
              <button
                className="w-full text-left py-2 px-3 text-black hover:bg-slate-100 rounded-md"
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
