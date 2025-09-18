// userSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { userApi } from '@api/modules/userApi';

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET /api/users/profile
      .addMatcher(
        userApi.endpoints.getProfile.matchPending,
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        userApi.endpoints.getProfile.matchFulfilled,
        (state, action) => {
          state.profile = action.payload;
          state.isLoading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.getProfile.matchRejected,
        (state, action) => {
          state.error = action.error?.message || 'Failed to load profile';
          state.isLoading = false;
        }
      );
  },
});

export const { clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
