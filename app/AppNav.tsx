"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/food", label: "Food" },
  { href: "/workout", label: "Workout" },
  { href: "/coach", label: "Coach" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export default function AppNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-3">
      {links.map((link) => {
        const active = isActive(link.href);

        return (
          <a
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-zinc-950 hover:bg-emerald-300"
                : "rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }
          >
            {link.label}
          </a>
        );
      })}

      <a
        href="/"
        className="ml-auto rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-black text-emerald-400"
      >
        Operation: Recode
      </a>
    </div>
  );
}