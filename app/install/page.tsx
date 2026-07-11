import AppNav from "../AppNav";

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:px-8">
        <AppNav />

        <nav className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
            Operation: Recode
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
            Install.
            <br />
            Use it like an app.
          </h1>
        </nav>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Mobile Setup</p>
          <h2 className="mt-1 text-2xl font-bold">Add to Home Screen</h2>

          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-emerald-300">iPhone / Safari</p>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-zinc-300">
                <li>Open the deployed website in Safari.</li>
                <li>Tap the Share button.</li>
                <li>Choose Add to Home Screen.</li>
                <li>Tap Add.</li>
              </ol>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-emerald-300">Android / Chrome</p>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-zinc-300">
                <li>Open the deployed website in Chrome.</li>
                <li>Tap the three-dot menu.</li>
                <li>Choose Add to Home screen or Install app.</li>
                <li>Confirm Install.</li>
              </ol>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-300">Important</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Use the Vercel link for mobile. Localhost only works on the computer running the app.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

