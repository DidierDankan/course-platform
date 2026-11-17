import config from "../config.js";
import PaymentService from "../db/PaymentService.js";
import EnrollmentService from "../db/EnrollmentService.js";
import { stripe } from "../lib/stripe.js";
import { CURRENCY } from "../lib/currency.js";
import { APP_NAME } from "../lib/brand.js";
import { logError } from "../lib/logError.js";
const CLIENT_URL = config.clientUrl;
const PAYMENT_PAID = "paid";

// Who bought what, from a Checkout Session. Checkout writes both ids into the session's metadata (and the PaymentIntent's
// as a fallback). Returns null when they're missing or not numbers.
async function purchaseOf(session) {
  let userId = Number(session.metadata?.user_id);
  let courseId = Number(session.metadata?.course_id);
  if ((!userId || !courseId) && session.payment_intent) {
    const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
    userId = Number(pi.metadata?.user_id);
    courseId = Number(pi.metadata?.course_id);
  }
  return Number.isInteger(userId) && userId > 0 && Number.isInteger(courseId) && courseId > 0 ? { userId, courseId } : null;
}

const isUnknownToStripe = (err) => err?.code === "resource_missing" || err?.statusCode === 404;

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
      
      if (await EnrollmentService.getEnrollment(userId, courseId)) {
        return res.status(409).json({ ok: false, message: "You already own this course." });
      }

      const customerId = await PaymentService.ensureStripeCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // Name shown on the Checkout page; overrides the Dashboard "Company name" for this session only.
        branding_settings: { display_name: APP_NAME },
        payment_method_types: ["card"],
        customer: customerId, // if you created one, optional
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
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
      logError("Create checkout session", err);
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
        config.stripe.webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send("Invalid signature");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // "completed" means the buyer finished Checkout, not that the money arrived.
        if (session.payment_status !== PAYMENT_PAID) return res.json({ received: true });

        const purchase = await purchaseOf(session);
        if (!purchase) {
          console.error("Webhook: checkout session without a valid user_id / course_id", { session: session.id });
          return res.status(400).send("Invalid metadata");
        }
        // The same function the buyer's return (/confirm) uses: whichever arrives second changes nothing.
        await PaymentService.recordPaidPurchase({ ...purchase, sessionId: session.id });
      }

      return res.json({ received: true });
    } catch (err) {
      logError("Webhook handler", err);
      return res.status(500).send("Webhook handler failed");
    }
  }

  // POST /api/payments/confirm { session_id }: the buyer is back from Stripe. Render's free server may have been asleep
  // when the webhook came (Stripe then retries minutes later), so the purchase is also recorded here.
  // Threat: the browser could send any id. It's only a key: the session is read FROM STRIPE, it must belong to this
  // user (403 otherwise: nobody can claim another buyer's purchase) and be paid (409 while it isn't).
  async confirmPayment(req, res) {
    try {
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(req.body.session_id);
      } catch (err) {
        if (isUnknownToStripe(err)) return res.status(404).json({ ok: false, message: "Payment not found." });
        throw err;
      }

      const purchase = await purchaseOf(session);
      if (!purchase || purchase.userId !== Number(req.user.id)) {
        return res.status(403).json({ ok: false, message: "This payment belongs to another account." });
      }
      if (session.payment_status !== PAYMENT_PAID) {
        return res.status(409).json({ ok: false, message: "Your payment is still being processed." });
      }

      await PaymentService.recordPaidPurchase({ ...purchase, sessionId: session.id });
      return res.json({ ok: true, courseId: purchase.courseId });
    } catch (err) {
      logError("Confirm payment", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new PaymentController();