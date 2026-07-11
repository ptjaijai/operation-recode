import AppNav from "../AppNav";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:px-8">
        <AppNav />

        <nav className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
            Operation: Recode
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
            Offline.
            <br />
            Reconnect to sync.
          </h1>
        </nav>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Connection Status</p>
          <h2 className="mt-2 text-2xl font-black">You are offline</h2>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Operation: Recode needs internet to sync with Supabase. Some cached pages may still open, but cloud data will update after you reconnect.
          </p>

          <a
            href="/"
            className="mt-5 inline-block rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
          >
            Try Dashboard
          </a>
        </section>
      </section>
    </main>
  );
}
