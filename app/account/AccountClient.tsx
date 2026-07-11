"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";
import {
  disableGuestMode,
  enableGuestMode,
  getAuthMode,
} from "../../lib/recode/auth-mode";

type AccountMode = "loading" | "logged-in" | "guest" | "locked";

export default function AccountClient() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<AccountMode>("loading");
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [canSetNewPassword, setCanSetNewPassword] = useState(false);

  const [message, setMessage] = useState("Checking account...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        disableGuestMode();
        setMode("logged-in");
        setMessage("Cloud sync is active.");
        return;
      }

      if (getAuthMode() === "guest") {
        setMode("guest");
        setMessage("Guest Mode is active. Data saves only on this device.");
        return;
      }

      setMode("locked");
      setMessage("Choose Login or Guest Mode before saving data.");
    }

    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (event === "PASSWORD_RECOVERY") {
        setCanSetNewPassword(true);
        setMessage("Enter your new password.");
        return;
      }

      if (currentUser) {
        disableGuestMode();
        setMode("logged-in");
        setMessage("Cloud sync is active.");
        return;
      }

      if (getAuthMode() === "guest") {
        setMode("guest");
        setMessage("Guest Mode is active. Data saves only on this device.");
        return;
      }

      setMode("locked");
      setMessage("Choose Login or Guest Mode before saving data.");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      setMessage("Enter email and password first.");
      return;
    }

    setIsLoading(true);
    setMessage("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    disableGuestMode();
    setUser(data.user);
    setMode("logged-in");
    setMessage("Logged in. Cloud sync is active.");
  }

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      setMessage("Enter email and password first.");
      return;
    }

    setIsLoading(true);
    setMessage("Creating account...");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      disableGuestMode();
      setUser(data.user);
      setMode("logged-in");
      setMessage("Account created. Cloud sync is active.");
      return;
    }

    setMessage("Account created. Check your email to confirm.");
  }

  async function signOut() {
    setIsLoading(true);
    setMessage("Signing out...");

    await supabase.auth.signOut();

    setIsLoading(false);
    setUser(null);
    disableGuestMode();
    setMode("locked");
    setMessage("Signed out. Choose Login or Guest Mode before saving.");
  }

  function continueGuest() {
    enableGuestMode();
    setUser(null);
    setMode("guest");
    setMessage("Guest Mode is active. Data saves only on this device.");
  }

  function exitGuest() {
    disableGuestMode();
    setUser(null);
    setMode("locked");
    setMessage("Guest Mode off. Choose Login or Guest Mode before saving.");
  }

  async function sendResetEmail() {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    setIsLoading(true);
    setMessage("Sending reset email...");

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/account` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Reset email sent. Open the link from your email.");
  }

  async function updatePassword() {
    if (!newPassword.trim()) {
      setMessage("Enter new password first.");
      return;
    }

    setIsLoading(true);
    setMessage("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCanSetNewPassword(false);
    setNewPassword("");
    setMessage("Password updated.");
  }

  const isLoggedIn = mode === "logged-in";
  const isGuest = mode === "guest";
  const isLocked = mode === "locked";

  return (
    <main className="min-h-screen text-white">
      <section className="recode-shell mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="recode-kicker">Operation: Recode</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
              Account
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Login for cloud sync, or use Guest Mode for local-only saving.
            </p>
          </div>

          <ModeBadge mode={mode} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-5">
            <section
              className={
                isLoggedIn
                  ? "recode-card-strong rounded-[2rem] p-6 md:p-8"
                  : isGuest
                  ? "rounded-[2rem] border border-amber-400/25 bg-amber-400/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8"
                  : "recode-card rounded-[2rem] p-6 md:p-8"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                    Save Mode
                  </p>

                  <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                    {isLoggedIn && "Cloud Sync"}
                    {isGuest && "Guest Mode"}
                    {isLocked && "Not Set"}
                    {mode === "loading" && "Checking"}
                  </h2>
                </div>

                <div
                  className={
                    isLoggedIn
                      ? "rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-zinc-950"
                      : isGuest
                      ? "rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-zinc-950"
                      : "rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-zinc-300"
                  }
                >
                  {isLoggedIn && "SYNC ON"}
                  {isGuest && "LOCAL"}
                  {isLocked && "LOCKED"}
                  {mode === "loading" && "..."}
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-300">{message}</p>

              <div className="mt-6 grid gap-3">
                {isLoggedIn && (
                  <>
                    <StatusRow label="Account" value={user?.email ?? "-"} />
                    <StatusRow label="Saving" value="Cloud + local backup" />
                    <StatusRow label="Use case" value="Best for phone + computer" />
                  </>
                )}

                {isGuest && (
                  <>
                    <StatusRow label="Account" value="No account" />
                    <StatusRow label="Saving" value="This browser only" />
                    <StatusRow label="Sync" value="Off" />
                  </>
                )}

                {isLocked && (
                  <>
                    <StatusRow label="Saving" value="Blocked" />
                    <StatusRow label="Required" value="Login or Guest Mode" />
                    <StatusRow label="Reason" value="Prevent accidental local data" />
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {isLoggedIn && (
                  <button
                    onClick={signOut}
                    disabled={isLoading}
                    className="recode-button-ghost"
                  >
                    Sign Out
                  </button>
                )}

                {isGuest && (
                  <button
                    onClick={exitGuest}
                    disabled={isLoading}
                    className="recode-button-ghost"
                  >
                    Exit Guest Mode
                  </button>
                )}

                {isLocked && (
                  <button
                    onClick={continueGuest}
                    disabled={isLoading}
                    className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 text-sm font-black text-amber-200 hover:bg-amber-400/15"
                  >
                    Continue as Guest
                  </button>
                )}

                <Link href="/today" className="recode-button-primary text-center">
                  Open Today
                </Link>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <MiniRule
                title="Locked"
                text="Cannot save yet"
                active={isLocked}
              />
              <MiniRule
                title="Guest"
                text="Save local only"
                active={isGuest}
              />
              <MiniRule
                title="Login"
                text="Cloud sync on"
                active={isLoggedIn}
              />
            </section>
          </section>

          <section className="space-y-5">
            {!isLoggedIn && (
              <section className="recode-card rounded-[2rem] p-6 md:p-8">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  Login
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Use cloud sync
                </h2>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="recode-label">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@email.com"
                      className="recode-input"
                    />
                  </label>

                  <label className="block">
                    <span className="recode-label">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="recode-input"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={signIn}
                      disabled={isLoading}
                      className="recode-button-primary"
                    >
                      Login
                    </button>

                    <button
                      onClick={signUp}
                      disabled={isLoading}
                      className="recode-button-ghost"
                    >
                      Create Account
                    </button>
                  </div>

                  <button
                    onClick={sendResetEmail}
                    disabled={isLoading}
                    className="text-left text-sm font-bold text-zinc-500 hover:text-white"
                  >
                    Forgot password? Send reset email
                  </button>
                </div>
              </section>
            )}

            {canSetNewPassword && (
              <section className="recode-card rounded-[2rem] p-6 md:p-8">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  Recovery
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Set new password
                </h2>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="recode-label">New Password</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      className="recode-input"
                    />
                  </label>

                  <button
                    onClick={updatePassword}
                    disabled={isLoading}
                    className="recode-button-primary"
                  >
                    Update Password
                  </button>
                </div>
              </section>
            )}

            {isLoggedIn && (
              <section className="recode-card rounded-[2rem] p-6 md:p-8">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  Ready
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Your account is active
                </h2>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  Food, workout, daily check-in, and goals can sync between your computer and phone.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href="/today" className="recode-button-primary text-center">
                    Open Today
                  </Link>

                  <Link href="/settings" className="recode-button-ghost text-center">
                    Settings
                  </Link>
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-white/5 bg-black/20 p-6">
              <p className="text-sm font-black text-zinc-300">Note</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Guest Mode is useful for testing. For real tracking across devices, use Login.
              </p>
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}

function ModeBadge({ mode }: { mode: AccountMode }) {
  if (mode === "logged-in") {
    return (
      <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">
        ● Logged in
      </div>
    );
  }

  if (mode === "guest") {
    return (
      <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-200">
        ● Guest Mode
      </div>
    );
  }

  if (mode === "locked") {
    return (
      <div className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200">
        ● Locked
      </div>
    );
  }

  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-zinc-400">
      Checking...
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
      <p className="text-sm font-bold text-zinc-500">{label}</p>
      <p className="text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MiniRule({
  title,
  text,
  active,
}: {
  title: string;
  text: string;
  active: boolean;
}) {
  return (
    <div
      className={
        active
          ? "rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-4"
          : "rounded-3xl border border-white/5 bg-black/20 p-4"
      }
    >
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{text}</p>
    </div>
  );
}

