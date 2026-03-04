import { apiSlice } from "../apiSlice";

export const publicApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSellerPublic: builder.query({
      query: (sellerId) => `/public/sellers/${sellerId}`,
      providesTags: (r, e, sellerId) => [{ type: "User", id: `seller-${sellerId}` }],
    }),
  }),
});

export const { useGetSellerPublicQuery } = publicApi;