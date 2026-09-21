import { createClient } from "@/lib/supabase/server";
import CharityManager from "./CharityManager";

export default async function AdminCharitiesPage() {
  const supabase = createClient();
  const { data: charities } = await supabase.from("charities").select("*").order("name");

  return (
    <div>
      <h1 className="font-display text-3xl text-parchment">Charities</h1>
      <p className="mt-1 text-muted">Add, edit, or remove causes shown in the directory and homepage spotlight.</p>
      <CharityManager initialCharities={charities ?? []} />
    </div>
  );
}
