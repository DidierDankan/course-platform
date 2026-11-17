import { apiSlice } from "@api/apiSlice";

export const COMMENTS_PAGE_SIZE = 20;

export const commentApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    // Newest first, "Show more" loads the next page (the server says whether there is one).
    courseComments: builder.infiniteQuery({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => (lastPage.hasMore ? lastPageParam + 1 : undefined),
      },
      query: ({ queryArg: courseId, pageParam }) => `/courses/${courseId}/comments?page=${pageParam}&limit=${COMMENTS_PAGE_SIZE}`,
      providesTags: (result, error, courseId) => [{ type: "Comments", id: courseId }],
    }),
    postComment: builder.mutation({
      query: ({ courseId, body }) => ({ url: `/courses/${courseId}/comments`, method: "POST", body: { body } }),
      invalidatesTags: (result, error, { courseId }) => [{ type: "Comments", id: courseId }],
    }),
    deleteComment: builder.mutation({
      query: ({ commentId }) => ({ url: `/courses/comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (result, error, { courseId }) => [{ type: "Comments", id: courseId }],
    }),
  }),
});

export const { useCourseCommentsInfiniteQuery, usePostCommentMutation, useDeleteCommentMutation } = commentApi;
