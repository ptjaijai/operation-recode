import Link from "next/link";
import AppNav from "../AppNav";

const menuItems = [
  {
    href: "/coach",
    title: "Coach",
    description: "Analyze your calories, food, workout, sleep, and water.",
  },
  {
    href: "/progress",
    title: "Progress",
    description: "Weekly trend, weight progress, calories, and workout burn.",
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Edit goals, backup data, and sync settings.",
  },
  {
    href: "/install",
    title: "Install",
    description: "Add Operation: Recode to your phone home screen.",
  },
  {
    href: "/login",
    title: "Account",
    description: "Sign in, sync cloud data, or reset password.",
  },
];

export default function MorePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:px-8">
        <AppNav />

        <nav className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
            Operation: Recode
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
            More.
            <br />
            Everything else.
          </h1>
        </nav>

        <section className="grid gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 hover:bg-zinc-900"
            >
              <p className="text-2xl font-black">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
