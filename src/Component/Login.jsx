import { useContext } from "react";
import AuthContext from "../store/Auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { authToken, setAuthToken, keycloak } = useContext(AuthContext);
  console.log("authToken:", authToken);
  const navigate = useNavigate();

  const authInitialize = async () => {
    try {
      const authenticated = await keycloak.init({
        checkLoginIframe: false,
        onLoad: "login-required",
      });

      if (authenticated) {
        setAuthToken(keycloak.token);
        localStorage.setItem("token", keycloak.token);
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to initialize Keycloak:", error);
    }
  };

  return (
    <div>
      <button onClick={authInitialize}>Login</button>
      <button onClick={() => keycloak.logout()}>Logout</button>
      {authToken && <p>Authenticated with token: {authToken}</p>}
    </div>
  );
}