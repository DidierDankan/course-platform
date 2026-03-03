import { apiSlice } from "@api/apiSlice";

export const courseApi = apiSlice.injectEndpoints({
  reducerPath: 'api',
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
    watchCourse: builder.query({
      query: (courseId) => `/courses/${courseId}/watch`,
      providesTags: (r, e, courseId) => [{ type: "Course", id: courseId }],
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
    getPublicCourse: builder.query({
      query: (courseId) => `/courses/${courseId}/public`,
      providesTags: (r, e, courseId) => [{ type: "Course", id: courseId }],
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
  useWatchCourseQuery,
  useGetPublicCourseQuery
} = courseApi;
