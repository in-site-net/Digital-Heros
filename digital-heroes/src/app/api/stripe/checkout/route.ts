import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLAN_PRICING } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: "monthly" | "yearly" };
  const pricing = PLAN_PRICING[plan];
  if (!pricing) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email!,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `Digital Heroes — ${pricing.label}` },
          unit_amount: pricing.amount,
          recurring: { interval: pricing.interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/subscribe?checkout=canceled`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
