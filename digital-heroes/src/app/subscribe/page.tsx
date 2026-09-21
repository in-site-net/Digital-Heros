"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Charity } from "@/lib/types";

export default function SubscribePage() {
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("charities").select("*").order("name");
      setCharities(data ?? []);
      if (data && data.length > 0) setCharityId(data[0].id);
    })();
  }, []);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    // Save charity choice on the profile before checkout.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ charity_id: charityId, charity_percent: charityPercent })
      .eq("id", user.id);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong starting checkout.");
      setLoading(false);
      return;
    }

    window.location.href = json.url;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="mb-8 inline-block font-display text-xl text-parchment">
        Digital <em className="text-leaf not-italic">Heroes</em>
      </Link>
      <h1 className="font-display text-3xl text-parchment">Choose your plan</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <PlanCard
          label="Monthly"
          price="₹499 / month"
          selected={plan === "monthly"}
          onClick={() => setPlan("monthly")}
        />
        <PlanCard
          label="Yearly"
          price="₹4,999 / year"
          note="Save ~16%"
          selected={plan === "yearly"}
          onClick={() => setPlan("yearly")}
        />
      </div>

      <h2 className="mt-10 font-display text-2xl text-parchment">Pick a charity</h2>
      <p className="mt-1 text-sm text-muted">At least 10% of your subscription goes here. You can raise it below.</p>
      <div className="mt-4 grid gap-3">
        {charities.map((c) => (
          <label
            key={c.id}
            className={`card flex cursor-pointer items-center justify-between !p-4 ${
              charityId === c.id ? "border-brass" : ""
            }`}
          >
            <div>
              <p className="font-medium text-parchment">{c.name}</p>
              <p className="text-sm text-muted">{c.summary}</p>
            </div>
            <input
              type="radio"
              name="charity"
              checked={charityId === c.id}
              onChange={() => setCharityId(c.id)}
            />
          </label>
        ))}
      </div>

      <div className="mt-6">
        <label className="label">Charity share: {charityPercent}%</label>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={charityPercent}
          onChange={(e) => setCharityPercent(Number(e.target.value))}
          className="w-full accent-brass"
        />
      </div>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}

      <button onClick={handleCheckout} disabled={loading || !charityId} className="btn-primary mt-10 w-full">
        {loading ? "Redirecting to checkout…" : "Continue to payment"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Payment is processed securely by Stripe. Test mode uses card 4242 4242 4242 4242.
      </p>
    </div>
  );
}

function PlanCard({
  label,
  price,
  note,
  selected,
  onClick,
}: {
  label: string;
  price: string;
  note?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card text-left transition-colors ${selected ? "border-brass" : ""}`}
    >
      <p className="font-medium text-parchment">{label}</p>
      <p className="mt-1 text-2xl text-brass">{price}</p>
      {note && <p className="mt-1 text-xs text-leaf">{note}</p>}
    </button>
  );
}
