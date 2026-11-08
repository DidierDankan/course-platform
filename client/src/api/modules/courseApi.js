import { apiSlice } from "@api/apiSlice";

export const COURSE_PAGE_SIZE = 12;

const coursesUrl = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  return `/courses/all?${sp.toString()}`;
};

export const courseApi = apiSlice.injectEndpoints({
  reducerPath: 'api',
  endpoints: (builder) => ({
    getAllCourses: builder.query({
      query: coursesUrl,
      providesTags: ["Courses"],
    }),
    // Browse: the library keeps the pages together and keeps showing the previous
    // filter's results until the new ones arrive. The arg is the filter set.
    browseCourses: builder.infiniteQuery({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // A short page means there is nothing after it.
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPage.length === COURSE_PAGE_SIZE ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => coursesUrl({ ...queryArg, page: pageParam, limit: COURSE_PAGE_SIZE }),
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
  useBrowseCoursesInfiniteQuery,
  useGetCoursesQuery,
  useAddCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetMediaQuery,
  useDeleteMediaMutation,
  useWatchCourseQuery,
  useGetPublicCourseQuery
} = courseApi;
