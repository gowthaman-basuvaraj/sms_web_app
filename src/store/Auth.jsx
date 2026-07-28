import { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { setToken, setRefreshToken, setKeyclock } from "./Store";
import { keycloak } from "../lib/keycloak";
import { markSessionExpired, resetSession } from "../lib/session";

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

    let refreshTimer;
    keycloak
      .init({
        onLoad: "login-required",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        if (!authenticated) return;
        publish();
        // Mirror EVERY successful refresh into the store (incl. refreshes triggered by
        // authFetch), so the socket handshake token stays current too, and clear any
        // "session expired" flag.
        keycloak.onAuthRefreshSuccess = () => {
          publish();
          resetSession();
        };
        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30).catch(() => markSessionExpired());
        };
        // Safety net: refresh proactively so an idle/backgrounded tab surfaces expiry even
        // without any API call (the onTokenExpired timer alone is unreliable when throttled).
        refreshTimer = setInterval(() => {
          keycloak.updateToken(70).catch(() => markSessionExpired());
        }, 60000);
      })
      .catch((error) => {
        console.error("Failed to initialize Keycloak:", error);
      });

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [dispatch]);

  return children;
};

Auth.propTypes = {
  children: PropTypes.node.isRequired,
};

export const Logout = () => keycloak.logout();

export { keycloak };
