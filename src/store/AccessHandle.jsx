import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { setHaveAccess, setUser } from "./Store";
import { authFetch } from "../lib/api";

const REQUIRED_ROLE = import.meta.env.VITE_REALM_ACCESS;

/**
 * Derives the user + access flag from the current token and registers the user with the
 * backend. Token refresh is handled by keycloak-js (see Auth.jsx); this simply reacts to
 * the token in the store changing.
 */
export const HandleAccess = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return;
    }

    const roles = decoded.realm_access?.roles || [];
    const hasAccess = roles.includes(REQUIRED_ROLE);
    const user = {
      name: decoded.preferred_username,
      role: hasAccess ? REQUIRED_ROLE : "",
    };

    dispatch(setUser(user));
    dispatch(setHaveAccess(hasAccess));

    authFetch("/user", {
      method: "POST",
      body: JSON.stringify(user),
    }).catch((error) => console.error("Failed to register user:", error));
  }, [token, dispatch]);

  return null;
};
