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
    console.log("Access token expired, refreshing...");
    const tokens = await RefreshToken();

    if (!tokens) {
      console.error("Failed to refresh token, user cannot access");
      dispatch(setHaveAccess(false));
      // localStorage.setItem("haveAccess", false);
      return null; // Return null to signify failure
    }

    return tokens.accessToken; // Return the new access token
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

      console.log("User data:", user);
      if (!res.ok) {
        throw new Error("Failed to add user data");
      }
      console.log("User data added successfully to the database");
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };

  // Check if token is valid or expired
  const handleToken = async () => {
    if (!token || isTokenExpired(token)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        dispatch(setToken(newToken)); // Use the new token
        dispatch(setRefreshToken(refresh_token));
        // localStorage.setItem("token", newToken);
        // localStorage.setItem("refresh_token", refresh_token);
      } else {
        return; // Exit if token refresh fails
      }
    }

    const decodedToken = jwtDecode(token); // Decode the token here
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

    // Call access with the valid token and decodedToken
    await access(token, decodedToken);
  };

  // Call the handleToken function when the component mounts
  useEffect(() => {
    if (token) {
      handleToken();
    }
  }, [token]); // Add token as a dependency but ensure it does not cause an infinite loop

  return null; // This component does not render anything
};
