import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Charity } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let session = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    session = { isSubscriber: true, isAdmin: profile?.role === "admin" };
  }

  const { data: featured } = await supabase
    .from("charities")
    .select("*")
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();

  const charity = featured as Charity | null;

  return (
    <div className="min-h-screen">
      <Nav session={session} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="mb-5 text-sm text-leaf">A round of golf, a real difference</p>
            <h1 className="font-display text-5xl leading-[1.05] text-parchment md:text-6xl">
              Play your round.
              <br />
              <span className="italic text-brass">Back a cause.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted">
              Log your last five scores, get a shot at the monthly prize draw,
              and send part of every subscription straight to a charity you
              pick. No leaderboard trophies here — the win is shared.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/subscribe" className="btn-primary">
                Subscribe from ₹499/mo
              </Link>
              <Link href="/charities" className="btn-secondary">
                See the charities
              </Link>
            </div>
          </div>

          <div className="card !bg-surface2">
            <p className="label">This month's pool</p>
            <p className="font-display text-4xl text-brass">₹1,84,300</p>
            <div className="mt-5 space-y-3 text-sm">
              <PoolRow label="5-number match" share="40%" note="rolls over if unclaimed" />
              <PoolRow label="4-number match" share="35%" />
              <PoolRow label="3-number match" share="25%" />
            </div>
            <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
              Every subscriber is entered automatically each month they're active.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-line/60 bg-surface/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-parchment">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            <Step n="1" title="Subscribe" body="Pick monthly or yearly. Cancel any time." />
            <Step n="2" title="Log your scores" body="Enter your last five Stableford rounds. We keep a rolling five." />
            <Step n="3" title="Pick a charity" body="At least 10% of your fee goes to a cause you choose — you can give more." />
            <Step n="4" title="Enter the draw" body="Every active month, you're in the pool. Match 3, 4 or 5 numbers to win." />
          </div>
        </div>
      </section>

      {/* Charity spotlight */}
      {charity && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="label">Spotlight</p>
            <div className="mt-3 grid gap-10 rounded-lg border border-line bg-surface p-8 md:grid-cols-[1fr_1.3fr] md:p-10">
              <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-leaf-dim/40 font-display text-2xl text-leaf">
                {charity.name}
              </div>
              <div>
                <h3 className="font-display text-2xl text-parchment">{charity.name}</h3>
                <p className="mt-3 text-muted">{charity.summary}</p>
                {charity.upcoming_event_name && (
                  <p className="mt-4 text-sm text-leaf">
                    Upcoming: {charity.upcoming_event_name}
                  </p>
                )}
                <Link href="/charities" className="mt-6 inline-block btn-secondary !px-5 !py-2 text-sm">
                  View all charities
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-line/60 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl text-parchment">
            Your next round could fund someone's next chance.
          </h2>
          <Link href="/subscribe" className="btn-primary mt-8 inline-flex">
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/60 py-10 text-center text-sm text-muted">
        Digital Heroes — built for the 2026 trainee selection assignment.
      </footer>
    </div>
  );
}

function PoolRow({ label, share, note }: { label: string; share: string; note?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}{note && <span className="text-xs"> · {note}</span>}</span>
      <span className="text-parchment">{share}</span>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-display text-2xl text-brass">{n}</p>
      <p className="mt-2 font-semibold text-parchment">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
