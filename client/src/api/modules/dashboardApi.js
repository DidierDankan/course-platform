import { apiSlice } from "@api/apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    getMyDashboard: builder.query({
      query: () => "/dashboard/me/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetMyDashboardQuery } = dashboardApi;