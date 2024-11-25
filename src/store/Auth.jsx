import { createContext, useState, useEffect } from "react";
import Keycloak from "keycloak-js";
import PropTypes from "prop-types";

const AuthContext = createContext();

const url =
  "https://auth.readymixerp.com/realms/rmc-dev/protocol/openid-connect/auth";
const realm = "rmc-dev";
const clientId = "rmc";
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
