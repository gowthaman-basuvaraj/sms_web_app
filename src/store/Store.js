import {configureStore, createAsyncThunk, createSlice,} from "@reduxjs/toolkit";

// Async thunk to fetch user-specific mute preferences for a sender
const fetchUserPreferences = createAsyncThunk(
  "get/user/preferences",
  async ({ userName, sender, token }) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_API}/user/preferences?userName=${userName}&sender=${sender}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch user preferences");
    }
    return await res.json();
  }
);

// Async thunk to fetch all sender mute preferences for a user
const fetchAllSenderMutePreferences = createAsyncThunk(
  "get/all/sender/mute/preferences",
  async ({userName, token}) => {
    console.log(userName, token, 'fetchAll')
    if(!userName){
      return []
    }
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_API}/user/all/preferences?userName=${userName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch all sender mute preferences");
    }
    const data = await res.json();
    return data.preferences;
  }
);

// Async thunk to update mute preference
const updateMutePreference = createAsyncThunk(
  "/post/user/preferences",
  async ({ userName, sender, mute, token }) => {
    console.log(userName, token, sender, mute, 'updateMutePreference')
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_API}/user/preference`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userName,
          senderName: sender,
          mutePreferences: mute,
        }),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update user preferences");
    }
    return { userName, sender, mute };
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
    mutePreferences: {},
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
      // console.log("Setting selected chat in store", id, sender, sim, mute);
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
    initializeMutePreferences: (state, action) => {
      const { userName, preferences } = action.payload;
      state.mutePreferences[userName] = {};
      preferences.forEach((pref) => {
        state.mutePreferences[userName][pref.senderName] =
          pref.mutePreferences === 1;
      });
    },
    updateMutePreferences: (state, action) => {
      const { userName, sender, mute } = action.payload;
      if (!state.mutePreferences[userName]) {
        state.mutePreferences[userName] = {};
      }
      state.mutePreferences[userName][sender] = mute;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPreferences.pending, (state) => {
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.selectedChat.mute = action.payload.preferences[0].mutePreferences === 1;
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        console.error(
          "Failed to fetch user preferences:",
          action.error.message
        );
      })

      .addCase(fetchAllSenderMutePreferences.fulfilled, (state, action) => {
        const userName = state.user.name;
        state.mutePreferences[userName] = {};
        action.payload.forEach((pref) => {
          state.mutePreferences[userName][pref.sender_name] =
            pref.mutePreferences === 1;
        });
      })
      .addCase(fetchAllSenderMutePreferences.rejected, (state, action) => {
        console.error(
          "Failed to fetch all sender mute preferences:",
          action.error.message
        );
      })

      .addCase(updateMutePreference.fulfilled, (state, action) => {
        const { userName, sender, mute } = action.payload;
        if (!state.mutePreferences[userName]) {
          state.mutePreferences[userName] = {};
        }
        state.mutePreferences[userName][sender] = mute;
        state.selectedChat.mute = mute;
      })
      .addCase(updateMutePreference.rejected, (state, action) => {
        console.error(
          "Failed to update mute preference:",
          action.error.message
        );
      });
  },
});

// Export actions and the configured store
export const {
  setToken,
  setRefreshToken,
  setHaveAccess,
  setUser,
  setImageURL,
  setSelectedChat,
  setKeyclock,
} = authSlice.actions;

// Configure the Redux store
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

// Export thunks and the store
export {
  fetchUserPreferences,
  fetchAllSenderMutePreferences,
  updateMutePreference,
};
export default store;
