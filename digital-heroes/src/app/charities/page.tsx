import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import CharityDirectory from "./CharityDirectory";

export const revalidate = 60;

export default async function CharitiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let session = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    session = { isSubscriber: true, isAdmin: profile?.role === "admin" };
  }

  const { data: charities } = await supabase.from("charities").select("*").order("name");

  return (
    <div className="min-h-screen">
      <Nav session={session} />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="label">Directory</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Charities you can back</h1>
        <p className="mt-3 max-w-xl text-muted">
          Every subscriber directs at least 10% of their fee to one of these causes at signup —
          and can choose to give more, any time.
        </p>
        <CharityDirectory charities={charities ?? []} />
      </div>
    </div>
  );
}
