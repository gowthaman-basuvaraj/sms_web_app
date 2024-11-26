import { FaRegUserCircle } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../UI/select";
import AuthContext from "../store/Auth";
import { useContext } from "react";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  const { keycloak } = useContext(AuthContext);

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
                <span className="text-white">{user.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="mt-4 p-0">
              <SelectItem value={user.role}>
                <b>Role:</b> {user.role}
              </SelectItem>
              <SelectItem
                value="logout"
                className="cursor-pointer hover:bg-slate-100 rounded-lg"
                onClick={() => keycloak.logout()}
              >
                Logout
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
