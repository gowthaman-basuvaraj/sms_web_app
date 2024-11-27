import { createContext, useState, useEffect } from "react";
import Keycloak from "keycloak-js";
import PropTypes from "prop-types";

const AuthContext = createContext();

const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENTID;

const keycloak = new Keycloak({ url, realm, clientId });

export const RefreshToken = async () => {
  const refresh_token = localStorage.getItem("refresh_token");

  if (!refresh_token) {
    console.error("Refresh token not found in localStorage");
    return null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_KEYCLOAK_CLIENTID,
          grant_type: "refresh_token",
          refresh_token: refresh_token,
        }).toString(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    console.log("Token refreshed successfully:", data);

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

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
          console.log("keycloak: ", keycloak);

          localStorage.setItem("token", keycloak.token);
          localStorage.setItem("refresh_token", keycloak.refreshToken);
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
