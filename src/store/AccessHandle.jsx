import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { RefreshToken } from "../store/Auth";
import { useDispatch, useSelector } from "react-redux";
import { setToken, setHaveAccess, setRefreshToken, setUser } from "./Store";

export const HandleAccess = () => {
  const dispatch = useDispatch();
  const { refresh_token, token } = useSelector((state) => state.auth);

  const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime - 300;
  };

  const refreshAccessToken = async () => {
    const tokens = await RefreshToken();

    if (!tokens) {
      console.error("Failed to refresh token, user cannot access");
      dispatch(setHaveAccess(false));
      return null;
    }

    return tokens.accessToken;
  };

  const access = async (token, decodedToken) => {
    const user = {
      name: decodedToken.preferred_username,
      role: decodedToken.realm_access.roles.includes(
        import.meta.env.VITE_REALM_ACCESS
      )
        ? import.meta.env.VITE_REALM_ACCESS
        : "",
    };
    dispatch(
      setHaveAccess(
        decodedToken.realm_access.roles.includes(
          import.meta.env.VITE_REALM_ACCESS
        )
          ? true
          : false
      )
    );

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        throw new Error("Failed to add user data");
      }
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };

  const handleToken = async () => {
    if (!token || isTokenExpired(token)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        dispatch(setToken(newToken));
        dispatch(setRefreshToken(refresh_token));
      } else {
        return;
      }
    }

    const decodedToken = jwtDecode(token);
    dispatch(
      setUser({
        name: decodedToken.preferred_username,
        role: decodedToken.realm_access.roles.includes(
          import.meta.env.VITE_REALM_ACCESS
        )
          ? import.meta.env.VITE_REALM_ACCESS
          : "",
      })
    );
    dispatch(
      setHaveAccess(
        decodedToken.realm_access.roles.includes(
          import.meta.env.VITE_REALM_ACCESS
        )
          ? true
          : false
      )
    );

    await access(token, decodedToken);
  };

  useEffect(() => {
    if (token) {
      handleToken();
    }
  }, [token]);

  return null;
};
