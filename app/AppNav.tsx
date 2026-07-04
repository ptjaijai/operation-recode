export default function AppNav() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-3">
      <a
        href="/"
        className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        Dashboard
      </a>

      <a
        href="/food"
        className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        Food
      </a>

      <a
        href="/workout"
        className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        Workout
      </a>

      <a
        href="/coach"
        className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-zinc-950 hover:bg-emerald-300"
      >
        Coach
      </a>

      <a
        href="/"
        className="ml-auto rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-black text-emerald-400"
      >
        Operation: Recode
      </a>
    </div>
  );
}