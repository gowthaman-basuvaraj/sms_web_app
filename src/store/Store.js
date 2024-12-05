import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const fetchUserPreferences = createAsyncThunk(
  `/get/user/preferences`,
  async ({ userName, sender }) => {
    console.log("Fetching user preferences data", userName, sender);
    const res = await fetch(
      `${
        import.meta.env.VITE_BACKEND_API
      }/user/preferences?userName=${userName}&sender=${sender}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch user preferences");
    }
    const data = await res.json();
    console.log("Fetched data:", data);
    return data;
  }
);

const updateMutePreference = createAsyncThunk(
  "/post/user/preferences",
  async ({ userName, sender, mute }) => {
    console.log("Updating mute preference:", userName, sender, mute);
    const res = await fetch(`${import.meta.env.VITE_BACKEND_API}/user/preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName,
        senderName: sender,
        mutePreferences: mute,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to update user preferences");
    }

    return mute;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: "",
    refresh_token: "",
    haveAccess: false,
    user: {
      id: 0,
      name: "",
      role: "",
    },
    imageURL: "",
    selectedChat: {
      id: 0,
      sender: "",
      sim: "",
      mute: true,
    },
    keyclock: {
      token: "",
      refresh_token: "",
      idTokenParsed: null,
      realmAccess: null,
      realm: null,
      refreshTokenParsed: null,
      tokenParsed: null,
      clientId: null,
    },
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setRefreshToken: (state, action) => {
      state.refresh_token = action.payload;
    },
    setHaveAccess: (state, action) => {
      state.haveAccess = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setImageURL: (state, action) => {
      state.imageURL = action.payload;
    },
    setSelectedChat: (state, action) => {
      const { id, sender, sim, mute } = action.payload;
      console.log("Setting selected chat in store", id, sender, sim, mute);
      state.selectedChat = { id, sender, sim, mute };
    },
    setKeyclock: (state, action) => {
      const {
        token,
        refresh_token,
        idTokenParsed,
        realmAccess,
        realm,
        refreshTokenParsed,
        tokenParsed,
        clientId,
      } = action.payload;

      state.keyclock = {
        token,
        refresh_token,
        idTokenParsed,
        realmAccess,
        realm,
        refreshTokenParsed,
        tokenParsed,
        clientId,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPreferences.pending, (state) => {
        console.log("Fetching user preferences...");
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        console.log(
          "User preferences fetched successfully in store:",
          action.payload.preferences
        );
        const muteStatus =
          action.payload.preferences[0].mutePreferences === 1 ? true : false;
        state.selectedChat.mute = muteStatus;
        console.log("Updated selected chat mute status:", muteStatus);
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        console.error("Failed to fetch user preferences:", action.error.message);
      })
      .addCase(updateMutePreference.fulfilled, (state, action) => {
        console.log("Mute preference updated successfully:", action.payload);
        state.selectedChat.mute = action.payload; 
      })
      .addCase(updateMutePreference.rejected, (state, action) => {
        console.error("Failed to update mute preference:", action.error.message);
      });
  },
});

export const {
  setToken,
  setRefreshToken,
  setHaveAccess,
  setUser,
  setImageURL,
  setSelectedChat,
  setKeyclock,
} = authSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export { fetchUserPreferences, updateMutePreference };
export default store;