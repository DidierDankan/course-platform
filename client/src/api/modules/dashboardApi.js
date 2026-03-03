import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getMyDashboard: builder.query({
      query: () => "/dashboard/me/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetMyDashboardQuery } = dashboardApi;