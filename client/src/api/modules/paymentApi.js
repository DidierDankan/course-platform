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
    // The buyer is back from Stripe: the server reads the session from Stripe and records the purchase (the webhook
    // does the same, whichever comes first). Answers { courseId }; 409 while Stripe is still processing the payment.
    confirmPayment: builder.mutation({
      query: (sessionId) => ({ url: "/payments/confirm", method: "POST", body: { session_id: sessionId } }),
      invalidatesTags: ["Payment", "Enrollments", "Dashboard", "Course", "Courses"],
    }),
  }),
});

export const { useCreateCheckoutSessionMutation, useConfirmPaymentMutation } = paymentApi;