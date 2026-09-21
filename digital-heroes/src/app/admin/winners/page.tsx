import { createClient } from "@/lib/supabase/server";
import WinnersTable from "./WinnersTable";

export default async function AdminWinnersPage() {
  const supabase = createClient();
  const { data: winners } = await supabase
    .from("winners")
    .select("*, profiles(full_name), draws(period_label)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-parchment">Winners</h1>
      <p className="mt-1 text-muted">Verify proof submissions and mark payouts as completed.</p>
      <WinnersTable initialWinners={winners ?? []} />
    </div>
  );
}
