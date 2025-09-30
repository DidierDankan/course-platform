import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQueryWithReauth';

export const courseApi = createApi({
  reducerPath: 'courseApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: (sellerId) => `/courses?seller_id=${sellerId}`,
      providesTags: ["Course"],
    }),
    addCourse: builder.mutation({
      query: (body) => ({
        url: "/courses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Course"],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/courses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Course"],
    }),
    deleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
    }),
    getMedia: builder.query({
      query: (courseId) => `/courses/${courseId}/media`,
      providesTags: (result, error, id) => [{ type: "Media", id }],
    }),
    deleteMedia: builder.mutation({
      query: (mediaId) => ({
        url: `/courses/media/${mediaId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Media"],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useAddCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetMediaQuery,
  useDeleteMediaMutation,
} = courseApi;
