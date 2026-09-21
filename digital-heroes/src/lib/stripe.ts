import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Amounts in the smallest currency unit (paise for INR).
export const PLAN_PRICING = {
  monthly: { amount: 49900, interval: "month" as const, label: "Monthly plan" },
  yearly: { amount: 499900, interval: "year" as const, label: "Yearly plan" },
};
