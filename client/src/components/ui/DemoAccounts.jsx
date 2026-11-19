import { DEMO_ACCOUNTS, DEMO_PASSWORD, STRIPE_TEST_CARD } from "@utils/demo";

// The demo accounts for portfolio visitors, under the login form. "Sign in as …" fills the real form and submits it,
// so a demo login goes through the same route, rate limit and cookies as any other: there is no demo-only way in.
export default function DemoAccounts({ onUse, disabled }) {
  if (!DEMO_PASSWORD) return null;

  return (
    <section className="panel demo-accounts" aria-labelledby="demo-accounts-title">
      <h2 id="demo-accounts-title" className="section-index">
        Try the demo
      </h2>
      <ul className="demo-account-list">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.id} className="demo-account">
            <div className="demo-account-text">
              <span className="demo-account-role">{account.label}</span>
              <code>{account.email}</code>
              <span className="demo-account-hint">{account.hint}</span>
            </div>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => onUse({ email: account.email, password: DEMO_PASSWORD })}
              disabled={disabled}
            >
              Sign in as {account.label.toLowerCase()}
            </button>
          </li>
        ))}
      </ul>
      <dl className="demo-facts">
        <div>
          <dt>Password (both)</dt>
          <dd>
            <code>{DEMO_PASSWORD}</code>
          </dd>
        </div>
        <div>
          <dt>Test card</dt>
          <dd>
            <code>{STRIPE_TEST_CARD.number}</code> · {STRIPE_TEST_CARD.rest}. Stripe test mode: nobody is charged.
          </dd>
        </div>
      </dl>
    </section>
  );
}
