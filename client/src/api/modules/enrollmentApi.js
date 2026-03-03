import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const enrollmentApi = createApi({
  reducerPath: "enrollmentApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Enrollments", "Dashboard"],
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
      query: ({ courseId, progress, completed }) => ({
        url: `/enrollments/${courseId}`,
        method: "PATCH",
        body: { progress, completed },
      }),
      invalidatesTags: ["Enrollments", "Dashboard"],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useEnrollInCourseMutation,
  useUpdateProgressMutation,
} = enrollmentApi;