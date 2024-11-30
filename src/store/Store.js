import { configureStore, createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: "",
    refresh_token: "",
    haveAccess: false,
    user: {
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

export default store;
