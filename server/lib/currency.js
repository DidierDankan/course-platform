// Currencies the app supports, as Stripe's lowercase currency codes.
export const CURRENCIES = Object.freeze({
  USD: "usd",
});

// The currency Stripe charges. Keep in sync with client/src/utils/currency/index.js,
// which sets what users see.
export const CURRENCY = CURRENCIES.USD;
