import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { logout, setCredentials } from '@store/slices/authSlice';

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3001/api',
  credentials: 'include', // ✅ Required to send cookies
  // prepareHeaders: (headers, { getState }) => {
  //   const token = getState().auth.token;
  //   if (token) headers.set('authorization', `Bearer ${token}`);
  //   return headers;
  // }
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock(); // wait if a refresh is already in progress
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // if not already refreshing
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);

        if (refreshResult.data) {
          api.dispatch(setCredentials(refreshResult.data));
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
