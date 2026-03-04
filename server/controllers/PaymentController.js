import PaymentService from "../db/PaymentService.js";
import { stripe } from "../lib/stripe.js";

const CLIENT_URL = process.env.CLIENT_URL;

class PaymentController {
  // POST /api/payments/checkout
  async createCheckoutSession(req, res) {
    try {
      const userId = req.user?.id;
      const { course_id } = req.body;

      if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
      if (!course_id) return res.status(400).json({ ok: false, message: "course_id is required" });

      const courseId = Number(course_id);
      const course = await PaymentService.getCourseById(courseId);
      if (!course) return res.status(404).json({ ok: false, message: "Course not found" });

      // ✅ sellers can enroll, but NOT in their own course
      if (course.seller_id && Number(course.seller_id) === Number(userId)) {
        return res.status(400).json({ ok: false, message: "You cannot buy your own course." });
      }

      const customerId = await PaymentService.ensureStripeCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer: customerId, // if you created one, optional
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: course.title },
              unit_amount: Math.round(Number(course.price) * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/courses/${courseId}`,

        // ✅ metadata available directly in checkout.session.completed
        metadata: {
          user_id: String(userId),
          course_id: String(courseId),
        },

        // ✅ also store metadata in PaymentIntent
        payment_intent_data: {
          metadata: {
            user_id: String(userId),
            course_id: String(courseId),
          },
          setup_future_usage: "off_session", // enables save card
        },
      });

      await PaymentService.upsertPendingPayment({
        userId,
        courseId: course.id,
        amount: course.price,
        sessionId: session.id,
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      console.error("createCheckoutSession error:", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  // POST /api/payments/webhook  (RAW BODY)
  async webhook(req, res) {
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("session.metadata", session.metadata);
        console.log("session.payment_intent", session.payment_intent);

        // session.payment_intent exists for payment mode
        let userId = Number(session.metadata?.user_id);
        let courseId = Number(session.metadata?.course_id);

        if ((!userId || !courseId) && session.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
          userId = Number(pi.metadata?.user_id);
          courseId = Number(pi.metadata?.course_id);
        }

        if (!Number.isFinite(userId) || !Number.isFinite(courseId)) {
          console.error("❌ userId/courseId invalid", { userId, courseId });
          return res.status(400).send("Invalid metadata");
        }

        await PaymentService.markPaymentPaid({ userId, courseId, sessionId: session.id });
        await PaymentService.createEnrollmentIfNeeded({ userId, courseId });
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      return res.status(500).send("Webhook handler failed");
    }
  }
}

export default new PaymentController();