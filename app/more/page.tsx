import Link from "next/link";
import AppNav from "../AppNav";

const menuItems = [
  {
    href: "/coach",
    title: "Coach",
    label: "Analysis",
    description: "See what to fix next based on food, workout, sleep, and water.",
  },
  {
    href: "/progress",
    title: "Progress",
    label: "Trends",
    description: "Track weekly weight, calories, protein, workout, and burn.",
  },
  {
    href: "/settings",
    title: "Settings",
    label: "Goals",
    description: "Edit targets, backup data, import, export, and clear logs.",
  },
  {
    href: "/install",
    title: "Install",
    label: "PWA",
    description: "Add Operation: Recode to your phone home screen.",
  },
  {
    href: "/account",
    title: "Account",
    label: "Save Mode",
    description: "Login, cloud sync, Guest Mode, or check Locked status.",
  },
];

export default function MorePage() {
  return (
    <main className="min-h-screen text-white">
      <section className="recode-shell mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="recode-kicker">Operation: Recode</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
              More
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Tools, account, progress, settings, and install options.
            </p>
          </div>

          <Link
            href="/account"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-zinc-300 hover:bg-white/[0.07] hover:text-white"
          >
            Account
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="recode-card group rounded-[2rem] p-5 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                    {item.label}
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">
                    {item.title}
                  </h2>
                </div>

                <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-sm font-black text-zinc-400 group-hover:border-emerald-400/40 group-hover:text-emerald-300">
                  →
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
