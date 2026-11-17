import { apiSlice } from "@api/apiSlice";

export const REVIEWS_PAGE_SIZE = 10;

// Saving or deleting a review changes the course's average, so the course page and every list refetch.
const afterReviewChange = (result, error, { courseId }) => [
  { type: "Reviews", id: courseId },
  { type: "Course", id: courseId },
  "Courses",
];

export const reviewApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    // Public, newest first, "Show more" loads the next page (the server says whether there is one).
    courseReviews: builder.infiniteQuery({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => (lastPage.hasMore ? lastPageParam + 1 : undefined),
      },
      query: ({ queryArg: courseId, pageParam }) => `/courses/${courseId}/reviews?page=${pageParam}&limit=${REVIEWS_PAGE_SIZE}`,
      providesTags: (result, error, courseId) => [{ type: "Reviews", id: courseId }],
    }),
    // The signed-in student's own review, to fill the form ({ review: null } when there is none).
    myReview: builder.query({
      query: (courseId) => `/courses/${courseId}/reviews/mine`,
      providesTags: (result, error, courseId) => [{ type: "Reviews", id: courseId }],
    }),
    saveReview: builder.mutation({
      query: ({ courseId, rating, body }) => ({ url: `/courses/${courseId}/reviews`, method: "PUT", body: { rating, body } }),
      invalidatesTags: afterReviewChange,
    }),
    deleteReview: builder.mutation({
      query: ({ courseId }) => ({ url: `/courses/${courseId}/reviews`, method: "DELETE" }),
      invalidatesTags: afterReviewChange,
    }),
  }),
});

export const { useCourseReviewsInfiniteQuery, useMyReviewQuery, useSaveReviewMutation, useDeleteReviewMutation } = reviewApi;
