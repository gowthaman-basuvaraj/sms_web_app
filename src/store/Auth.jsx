import { useEffect } from "react";
import Keycloak from "keycloak-js";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { setToken, setRefreshToken, setKeyclock } from "./Store";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENTID,
});

// Guard against a second init (React StrictMode / fast refresh).
let initStarted = false;

const snapshot = () => ({
  token: keycloak.token,
  refresh_token: keycloak.refreshToken,
  idTokenParsed: keycloak.idTokenParsed,
  realmAccess: keycloak.realmAccess,
  realm: keycloak.realm,
  refreshTokenParsed: keycloak.refreshTokenParsed,
  tokenParsed: keycloak.tokenParsed,
  clientId: keycloak.clientId,
});

export const Auth = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (initStarted) return;
    initStarted = true;

    const publish = () => {
      dispatch(setKeyclock(snapshot()));
      dispatch(setToken(keycloak.token));
      dispatch(setRefreshToken(keycloak.refreshToken));
    };

    keycloak
      .init({
        onLoad: "login-required",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        if (!authenticated) return;
        publish();
        // keycloak-js refreshes the token itself; just mirror the new one into the store.
        keycloak.onTokenExpired = () => {
          keycloak
            .updateToken(30)
            .then((refreshed) => {
              if (refreshed) publish();
            })
            .catch(() => keycloak.login());
        };
      })
      .catch((error) => {
        console.error("Failed to initialize Keycloak:", error);
      });
  }, [dispatch]);

  return children;
};

Auth.propTypes = {
  children: PropTypes.node.isRequired,
};

export const Logout = () => keycloak.logout();

export { keycloak };
