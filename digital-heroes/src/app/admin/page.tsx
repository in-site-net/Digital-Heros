import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [{ count: totalUsers }, { data: subs }, { data: donations }, { count: totalDraws }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("amount_cents").eq("status", "active"),
    supabase.from("donations").select("amount_cents"),
    supabase.from("draws").select("*", { count: "exact", head: true }),
  ]);

  const totalPrizePool = (subs ?? []).reduce((sum, s) => sum + s.amount_cents, 0);
  const charityTotal = (donations ?? []).reduce((sum, d) => sum + d.amount_cents, 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-parchment">Reports & analytics</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={String(totalUsers ?? 0)} />
        <Stat label="Active subscription revenue" value={`₹${(totalPrizePool / 100).toLocaleString("en-IN")}`} />
        <Stat label="Charity contributions" value={`₹${(charityTotal / 100).toLocaleString("en-IN")}`} />
        <Stat label="Draws run" value={String(totalDraws ?? 0)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className="mt-1 font-display text-2xl text-brass">{value}</p>
    </div>
  );
}
