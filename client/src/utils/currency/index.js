// Currencies the app supports. To add one, add an entry here.
export const CURRENCIES = Object.freeze({
  USD: Object.freeze({ code: "USD", locale: "en-US" }),
});

// The currency used across the app. Keep in sync with server/lib/currency.js,
// which sets what Stripe actually charges.
export const CURRENCY = CURRENCIES.USD;

const formatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
});

export const formatPrice = (amount) => formatter.format(Number(amount) || 0);
