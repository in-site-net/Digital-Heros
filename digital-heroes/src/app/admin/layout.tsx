import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TABS = [
  { href: "/admin", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/winners", label: "Winners" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line/60 bg-surface/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg text-parchment">
            Digital <em className="text-leaf not-italic">Heroes</em> <span className="text-muted">/ Admin</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-parchment">Back to site</Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-6 text-sm text-muted">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="border-b-2 border-transparent py-3 hover:border-brass hover:text-parchment">
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
