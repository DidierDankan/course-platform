import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQueryWithReauth';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/user/profile',
    }),
  }),
});

export const { useGetProfileQuery } = userApi;