import { createClient } from "@/lib/supabase/server";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, subscriptions(status, plan)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-parchment">Users</h1>
      <p className="mt-1 text-muted">View and edit user profiles and subscription status.</p>
      <UsersTable initialUsers={profiles ?? []} />
    </div>
  );
}
