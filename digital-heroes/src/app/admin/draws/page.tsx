import { createClient } from "@/lib/supabase/server";
import DrawRunner from "./DrawRunner";

export default async function AdminDrawsPage() {
  const supabase = createClient();
  const { data: draws } = await supabase.from("draws").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-parchment">Draws</h1>
      <p className="mt-1 text-muted">Configure the mode, simulate before publishing, then publish results.</p>
      <DrawRunner pastDraws={draws ?? []} />
    </div>
  );
}
