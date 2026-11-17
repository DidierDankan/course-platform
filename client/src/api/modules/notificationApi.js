import { apiSlice } from "@api/apiSlice";

// How often the header asks for the unread count while the tab is visible. Polling, not WebSockets (see TODO 4c):
// under a minute is fine for "you got a review", and it works the same locally and on Render's sleeping free plan.
export const NOTIFICATIONS_POLL_MS = 60_000;
export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationApi = apiSlice.injectEndpoints({
  reducerPath: "api",
  endpoints: (builder) => ({
    unreadNotifications: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    notifications: builder.infiniteQuery({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => (lastPage.hasMore ? lastPageParam + 1 : undefined),
      },
      query: ({ pageParam }) => `/notifications?page=${pageParam}&limit=${NOTIFICATIONS_PAGE_SIZE}`,
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/read", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const { useUnreadNotificationsQuery, useNotificationsInfiniteQuery, useMarkNotificationsReadMutation } = notificationApi;
