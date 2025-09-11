import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,             // user object with id, email, role, etc.
  token: null,            // JWT token
  isAuthenticated: false, // auth status
  loading: false,         // useful for UI feedback
  error: null,            // optional: store auth error message
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
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
