import { apiSlice } from "../apiSlice";

export const favoritesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyFavorites: builder.query({
      query: () => "/favorites",
      providesTags: ["Favorites"],
    }),
    checkFavorite: builder.query({
      query: (courseId) => `/favorites/${courseId}`,
      providesTags: (r, e, courseId) => [{ type: "Favorites", id: courseId }],
    }),
    addFavorite: builder.mutation({
      query: (course_id) => ({
        url: "/favorites",
        method: "POST",
        body: { course_id },
      }),
      invalidatesTags: ["Favorites", "Dashboard"],
    }),
    removeFavorite: builder.mutation({
      query: (courseId) => ({
        url: `/favorites/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Favorites", "Dashboard"],
    }),
  }),
});

export const {
  useGetMyFavoritesQuery,
  useCheckFavoriteQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi;