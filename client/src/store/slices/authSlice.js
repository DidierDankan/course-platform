import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,             // user object with id, email, role, etc.
  isAuthenticated: false, // auth status
  loading: false,         // useful for UI feedback
  error: null,            // optional: store auth error message
  initialized: false, // 👈 Add this
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      state.initialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.initialized = true;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
