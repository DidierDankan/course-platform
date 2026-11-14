import { apiSlice } from "@api/apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    getMyDashboard: builder.query({
      query: () => "/dashboard/me/dashboard",
      providesTags: ["Dashboard"],
    }),
    // The signed-in seller's own numbers for the last 12 months (server: SellerStatsService).
    getSellerStats: builder.query({
      query: () => "/dashboard/seller/stats",
      providesTags: ["SellerStats"],
    }),
  }),
});

export const { useGetMyDashboardQuery, useGetSellerStatsQuery } = dashboardApi;