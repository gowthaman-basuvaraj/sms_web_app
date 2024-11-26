import { createContext, useState, useEffect } from "react";
import Keycloak from "keycloak-js";
import PropTypes from "prop-types";

const AuthContext = createContext();

const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENTID;

const keycloak = new Keycloak({ url, realm, clientId });

export const Auth = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          checkLoginIframe: false,
          onLoad: "login-required",
        });

        if (authenticated) {
          setAuthToken(keycloak.token);
          console.log("Authenticated successfully");
          localStorage.setItem("token", keycloak.token);
        }
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
      }
    };

    initKeycloak();
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, setAuthToken, keycloak }}>
      {children}
    </AuthContext.Provider>
  );
};

Auth.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
