"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { getAuthMode } from "../lib/recode/auth-mode";

type SaveMode = "loading" | "sync" | "guest" | "locked";

const primaryLinks = [
  { href: "/today", label: "Today" },
  { href: "/plan", label: "Plan" },
  { href: "/food", label: "Food" },
  { href: "/workout", label: "Workout" },
  { href: "/coach", label: "Coach" },
];

const secondaryLinks = [
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
  { href: "/install", label: "Install" },
  { href: "/account", label: "Account" },
];

const mobileLinks = [
  { href: "/today", label: "Home", icon: "โ—" },
  { href: "/plan", label: "Plan", icon: "โ“" },
  { href: "/food", label: "Food", icon: "+" },
  { href: "/workout", label: "Move", icon: "โ—" },
  { href: "/more", label: "More", icon: "โ€ฆ" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/today") return pathname === "/" || pathname === "/today";
  return pathname.startsWith(href);
}

export default function AppNav() {
  const pathname = usePathname();
  const [saveMode, setSaveMode] = useState<SaveMode>("loading");

  useEffect(() => {
    const supabase = createClient();

    async function checkSaveMode() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        setSaveMode("sync");
        return;
      }

      if (getAuthMode() === "guest") {
        setSaveMode("guest");
        return;
      }

      setSaveMode("locked");
    }

    checkSaveMode();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSaveMode("sync");
        return;
      }

      if (getAuthMode() === "guest") {
        setSaveMode("guest");
        return;
      }

      setSaveMode("locked");
    });

    function handleStorageChange() {
      checkSaveMode();
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 -mx-5 mb-8 hidden border-b border-white/5 bg-black/45 px-5 py-4 backdrop-blur-2xl md:-mx-8 md:block md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
          <Link href="/today" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[1.1rem] bg-emerald-400 text-sm font-black text-zinc-950 shadow-[0_0_50px_rgba(52,211,153,0.2)]">
              R
            </div>

            <div className="leading-none">
              <p className="text-sm font-black tracking-tight text-white">
                Recode
              </p>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                Body OS
              </p>
            </div>
          </Link>

          <nav className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-2xl shadow-black/20">
            {primaryLinks.map((link) => {
              const isActive = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? "rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-950 shadow-sm"
                      : "rounded-full px-4 py-2 text-sm font-bold text-zinc-500 hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-white/[0.07] hover:text-white">
                More
              </summary>

              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                {secondaryLinks.map((link) => {
                  const isActive = isActivePath(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        isActive
                          ? "block rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950"
                          : "block rounded-2xl px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                      }
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </details>

            <SaveModeChip mode={saveMode} />
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-white/5 bg-black/70 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 backdrop-blur-2xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
          {mobileLinks.map((link) => {
            const isActive = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "rounded-2xl bg-white px-2 py-2 text-center text-xs font-black text-zinc-950"
                    : "rounded-2xl px-2 py-2 text-center text-xs font-bold text-zinc-500"
                }
              >
                <span className="block text-base leading-none">{link.icon}</span>
                <span className="mt-1 block text-[10px] leading-none">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-24 md:hidden" />
    </>
  );
}

function SaveModeChip({ mode }: { mode: SaveMode }) {
  if (mode === "sync") {
    return (
      <Link
        href="/account"
        className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/15"
      >
        โ— Sync On
      </Link>
    );
  }

  if (mode === "guest") {
    return (
      <Link
        href="/account"
        className="rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-200 hover:bg-amber-400/15"
      >
        โ— Guest
      </Link>
    );
  }

  if (mode === "locked") {
    return (
      <Link
        href="/account"
        className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-400/15"
      >
        โ— Locked
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-zinc-400"
    >
      Checking
    </Link>
  );
}
