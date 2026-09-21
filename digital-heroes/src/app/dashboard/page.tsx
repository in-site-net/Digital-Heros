import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import ScorePanel from "./ScorePanel";
import CharityPanel from "./CharityPanel";
import WinningsPanel from "./WinningsPanel";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscription }, { data: scores }, { data: charities }, { data: entries }, { data: winners }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("scores").select("*").eq("user_id", user.id).order("played_on", { ascending: false }),
      supabase.from("charities").select("*").order("name"),
      supabase.from("draw_entries").select("*, draws(period_label, status, published_at)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("winners").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

  const session = { isSubscriber: true, isAdmin: profile?.role === "admin" };
  const upcomingDraws = (entries ?? []).filter((e: any) => e.draws?.status !== "published").length;

  return (
    <div className="min-h-screen">
      <Nav session={session} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl text-parchment">
          Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>

        {/* Subscription status */}
        <div className="mt-6 card flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">Subscription</p>
            <p className="text-lg text-parchment">
              {subscription
                ? `${subscription.plan === "monthly" ? "Monthly" : "Yearly"} · ${subscription.status}`
                : "No active subscription"}
            </p>
            {subscription?.current_period_end && (
              <p className="text-sm text-muted">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          {!subscription && (
            <a href="/subscribe" className="btn-primary !py-2.5 text-sm">Subscribe now</a>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ScorePanel initialScores={scores ?? []} />
          <CharityPanel profile={profile} charities={charities ?? []} />
        </div>

        {/* Participation + winnings */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <p className="label">Participation</p>
            <p className="mt-1 text-2xl text-parchment">{entries?.length ?? 0} draws entered</p>
            <p className="mt-1 text-sm text-muted">{upcomingDraws} awaiting results</p>
            <ul className="mt-4 space-y-2 text-sm">
              {(entries ?? []).slice(0, 5).map((e: any) => (
                <li key={e.id} className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">{e.draws?.period_label ?? "—"}</span>
                  <span className="text-parchment">
                    {e.draws?.status === "published" ? `${e.match_count} matched` : "Pending"}
                  </span>
                </li>
              ))}
              {(entries ?? []).length === 0 && <p className="text-muted">No entries yet — subscribe to be entered automatically.</p>}
            </ul>
          </div>

          <WinningsPanel initialWinners={winners ?? []} />
        </div>
      </div>
    </div>
  );
}
