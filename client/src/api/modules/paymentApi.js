import { apiSlice } from "@api/apiSlice";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCheckoutSession: builder.mutation({
      query: (course_id) => ({
        url: "/payments/checkout",
        method: "POST",
        body: { course_id },
      }),
      invalidatesTags: ["Payment", "Enrollments", "Dashboard"], // optional but useful
    }),
  }),
});

export const { useCreateCheckoutSessionMutation } = paymentApi;