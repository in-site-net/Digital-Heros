import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Nav({ session }: { session: { isSubscriber: boolean; isAdmin: boolean } | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-parchment">
          Digital <em className="text-leaf not-italic font-medium">Heroes</em>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/charities" className="hover:text-parchment">Charities</Link>
          <Link href="/#how-it-works" className="hover:text-parchment">How it works</Link>
          {session?.isAdmin && (
            <Link href="/admin" className="hover:text-parchment">Admin</Link>
          )}
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-parchment">Dashboard</Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="hover:text-parchment">Log in</Link>
          )}
        </div>
        <Link href={session ? "/dashboard" : "/subscribe"} className="btn-primary !px-5 !py-2 text-sm">
          {session ? "My account" : "Subscribe"}
        </Link>
      </nav>
    </header>
  );
}
