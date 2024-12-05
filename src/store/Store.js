import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const fetchUserPreferences = createAsyncThunk(
  `/get/user/preferences`,
  async ({ userName, sender }) => {
    console.log("fetching user preferences data", userName, sender);
    const res = await fetch(
      `${
        import.meta.env.VITE_BACKEND_API
      }/user/preferences?userName=${userName}&sender=${sender}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch user preferences");
    }
    const data = await res.json();
    console.log("store data", data);
    return data;
  }
);

const updateMutePreference = createAsyncThunk(
  "/post/user/preferences",
  async ({ userName, sender, mute }) => {
    const res = fetch(`${import.meta.env.VITE_BACKEND_API}/user/preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: userName,
        senderName: sender,
        mutePreferences: mute,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to set user preferences");
    }
    const data = await res.json();
    fetchUserPreferences({ userName, sender });
    return data.mutePreferences;
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
      .addCase(fetchUserPreferences.pending, (state, action) => {
        console.log("Fetching user preferences...", action.payload);
        state.selectedChat.mute = true;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        console.log("User preferences fetched successfully in store", action.payload.preferences);
        state.selectedChat.mute = action.payload.preferences[0].mutePreferences === 1 ? true : false;
        console.log("Updating selected chat mute status in store", state.selectedChat.mute);
      })
      .addCase(updateMutePreference.fulfilled, (state, action) => {
        state.selectedChat.mute = action.payload;
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

// Configure the store
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});
export { fetchUserPreferences, updateMutePreference };
export default store;
