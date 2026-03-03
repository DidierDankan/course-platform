import db from "./connection.js";
import { stripe } from "../lib/stripe.js";

class PaymentService {
  async getUserById(userId) {
    const [[user]] = await db.query(
      "SELECT id, email, stripe_customer_id FROM users WHERE id = ?",
      [userId]
    );
    return user || null;
  }

  async getCourseById(courseId) {
    const [[course]] = await db.query(
      "SELECT id, title, price, seller_id FROM courses WHERE id = ?",
      [courseId]
    );
    return course || null;
  }

  async ensureStripeCustomer(userId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    if (user.stripe_customer_id) return user.stripe_customer_id;

    const customer = await stripe.customers.create({ email: user.email });
    await db.query(
      "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
      [customer.id, userId]
    );
    return customer.id;
  }

  async upsertPendingPayment({ userId, courseId, amount, sessionId }) {
    await db.query(
      `INSERT INTO payments (user_id, course_id, status, amount, stripe_session_id, payment_date)
       VALUES (?, ?, 'pending', ?, ?, NULL)
       ON DUPLICATE KEY UPDATE
         status='pending',
         amount=VALUES(amount),
         stripe_session_id=VALUES(stripe_session_id),
         payment_date=NULL`,
      [userId, courseId, amount, sessionId]
    );
  }

  async markPaymentPaid({ userId, courseId, sessionId }) {
    await db.query(
      `UPDATE payments
       SET status='paid', payment_date=NOW(), stripe_session_id=COALESCE(stripe_session_id, ?)
       WHERE user_id=? AND course_id=?`,
      [sessionId, userId, courseId]
    );
  }

  async createEnrollmentIfNeeded({ userId, courseId }) {
    await db.query(
      `INSERT INTO enrollments (user_id, course_id, progress, completed, last_position_seconds, enrolled_at, updated_at)
       VALUES (?, ?, 0, 0, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at=NOW()`,
      [userId, courseId]
    );
  }
}

export default new PaymentService();