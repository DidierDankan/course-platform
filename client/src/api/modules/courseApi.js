import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQueryWithReauth';

export const courseApi = createApi({
  reducerPath: 'courseApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAllCourses: builder.query({
      query: ({ page = 1, limit = 6 } = {}) => `/courses/all?page=${page}&limit=${limit}`,
      providesTags: ["Courses"],
    }),
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
      query: ({ id, formData }) => ({
        url: `/courses/${id}`,
        method: "PUT",
        body: formData,
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
  useGetAllCoursesQuery,
  useGetCoursesQuery,
  useAddCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetMediaQuery,
  useDeleteMediaMutation,
} = courseApi;
