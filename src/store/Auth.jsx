import { useEffect } from "react";
import Keycloak from "keycloak-js";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { setToken, setKeyclock, setRefreshToken } from "./Store";


const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENTID;

const keycloak = new Keycloak({ url, realm, clientId });

export const RefreshToken = () => {
  const dispatch = useDispatch();
  const { refresh_token } = useSelector((state) => state.auth);
  const keycloakData = {
    token: keycloak.token,
    refresh_token: keycloak.refreshToken,
    idTokenParsed: keycloak.idTokenParsed,
    realmAccess: keycloak.realmAccess,
    realm: keycloak.realm,
    refreshTokenParsed: keycloak.refreshTokenParsed,
    tokenParsed: keycloak.tokenParsed,
    clientId: keycloak.clientId,
  };
  dispatch(setKeyclock(keycloakData));

  // const refresh_token = localStorage.getItem("refresh_token");

  if (!refresh_token) {
    console.error("Refresh token not found in localStorage");
    return null;
  }

  async function refresh() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${
          import.meta.env.VITE_KEYCLOAK_REALM
        }/protocol/openid-connect/token`,
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

      // localStorage.setItem("token", data.access_token);
      // localStorage.setItem("refresh_token", data.refresh_token);

      dispatch(setToken(data.access_token));
      dispatch(setRefreshToken(data.refresh_token));

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }
  refresh();
};

export const Auth = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          checkLoginIframe: false,
          onLoad: "login-required",
        });

        if (authenticated) {

          // localStorage.setItem("keyclock", keycloak);
          // localStorage.setItem("refresh_token", keycloak.refreshToken);
          const keycloakData = {
            token: keycloak.token,
            refresh_token: keycloak.refreshToken,
            idTokenParsed: keycloak.idTokenParsed,
            realmAccess: keycloak.realmAccess,
            realm: keycloak.realm,
            refreshTokenParsed: keycloak.refreshTokenParsed,
            tokenParsed: keycloak.tokenParsed,
            clientId: keycloak.clientId,
          };
          dispatch(setKeyclock(keycloakData));
          dispatch(setToken(keycloak.token));
          dispatch(setRefreshToken(keycloak.refreshToken));
        }
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
      }
    };

    initKeycloak();
  }, []);

  return (
    <>
      {children}
    </>
  );
};

Auth.propTypes = {
  children: PropTypes.node.isRequired,
};

export const Logout = () => {
  keycloak.logout();
}
