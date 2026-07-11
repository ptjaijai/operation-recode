"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
  { href: "/food", label: "Food" },
  { href: "/workout", label: "Workout" },
  { href: "/coach", label: "Coach" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
  { href: "/install", label: "Install" },
  { href: "/login", label: "Account" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 -mx-5 mb-6 border-b border-zinc-800/80 bg-zinc-950/90 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto pb-1">
        <Link
          href="/"
          className="mr-1 shrink-0 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300"
        >
          Recode
        </Link>

        <nav className="flex min-w-max items-center gap-2">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "shrink-0 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-zinc-950"
                    : "shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}