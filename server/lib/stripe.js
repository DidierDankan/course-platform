import config from "../config.js";
import Stripe from "stripe";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2026-02-25.clover",
});