import { apiSlice } from "@api/apiSlice";


export const enrollmentApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    getMyEnrollments: builder.query({
      query: () => "/enrollments",
      providesTags: ["Enrollments"],
    }),

    enrollInCourse: builder.mutation({
      query: (course_id) => ({
        url: "/enrollments",
        method: "POST",
        body: { course_id },
      }),
      invalidatesTags: ["Enrollments", "Dashboard"],
    }),

    updateProgress: builder.mutation({
      query: ({ courseId, progress, completed, lastWatchedMediaId, lastPositionSeconds }) => ({
        url: `/enrollments/${courseId}`,
        method: "PATCH",
        body: { progress, completed, lastWatchedMediaId, lastPositionSeconds },
      }),
      invalidatesTags: ["Enrollments", "Dashboard"],
    }),

    checkEnrollment: builder.query({
      query: (courseId) => `/enrollments/${courseId}`,
      providesTags: (r, e, courseId) => [{ type: "Enrollments", id: courseId }],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useEnrollInCourseMutation,
  useUpdateProgressMutation,
  useCheckEnrollmentQuery
} = enrollmentApi;