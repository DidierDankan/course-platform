import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { userApi } from "@api/modules/userApi";
import { courseApi } from "@api/modules/courseApi";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,  // ✅ add reducer
    auth: authReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      userApi.middleware,
      courseApi.middleware // ✅ add middleware
    ),
});
