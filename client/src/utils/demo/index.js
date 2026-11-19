// The public demo accounts that `npm run seed:demo` creates (server/scripts/lib.js holds the same emails: keep them in
// sync). The password is the seed's DEMO_PASSWORD, given to the build as VITE_DEMO_PASSWORD so it never sits in git
// and can be changed without a code change. It is public on purpose: the login page shows it to every visitor. With
// no VITE_DEMO_PASSWORD (a build without demo accounts), the login page shows no demo panel.
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || null;

export const DEMO_ACCOUNTS = [
  { id: "student", label: "Student", email: "demo-student@lumen.test", hint: "Buy a course, watch it, leave a review" },
  { id: "instructor", label: "Instructor", email: "demo-instructor@lumen.test", hint: "Sales charts, your courses, notifications" },
];

// Stripe's test card: Checkout runs in test mode, so nobody is ever charged.
export const STRIPE_TEST_CARD = { number: "4242 4242 4242 4242", rest: "any future date, any CVC" };
