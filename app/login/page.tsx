"use client";

import { useEffect, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [canSetNewPassword, setCanSetNewPassword] = useState(false);
  const [status, setStatus] = useState("Checking session...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setUserEmail("");
        setStatus("You are not signed in.");
        return;
      }

      setUserEmail(data.user.email ?? "");
      setEmail(data.user.email ?? "");
      setStatus("You are signed in.");
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanSetNewPassword(true);
        setUserEmail(session?.user.email ?? "");
        setEmail(session?.user.email ?? "");
        setStatus("Reset link verified. Set your new password below.");
        return;
      }

      if (event === "SIGNED_IN") {
        setUserEmail(session?.user.email ?? "");
        setEmail(session?.user.email ?? "");
      }

      if (event === "SIGNED_OUT") {
        setUserEmail("");
        setCanSetNewPassword(false);
        setNewPassword("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signUp() {
    if (!email || !password) {
      setStatus("Enter your email and password first.");
      return;
    }

    if (password.length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setStatus("Creating account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Account created. Check your email if confirmation is required.");
  }

  async function signIn() {
    if (!email || !password) {
      setStatus("Enter your email and password first.");
      return;
    }

    setLoading(true);
    setStatus("Signing in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setUserEmail(data.user.email ?? "");
    setStatus("Signed in. Redirecting...");
    window.location.href = "/";
  }

  async function signOut() {
    setLoading(true);
    setStatus("Signing out...");

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setUserEmail("");
    setPassword("");
    setNewPassword("");
    setCanSetNewPassword(false);
    setStatus("Signed out.");
  }

  async function sendResetPasswordEmail() {
    if (!email) {
      setStatus("Enter your email first.");
      return;
    }

    setLoading(true);
    setStatus("Sending reset link...");

    const redirectTo = `${window.location.origin}/login`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Reset link sent. Open the email to continue.");
  }

  async function saveNewPasswordFromEmailLink() {
    if (!canSetNewPassword) {
      setStatus("Open the password reset link from your email first.");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setStatus("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setNewPassword("");
    setCanSetNewPassword(false);
    setStatus("Password updated. You can now sign in with your new password.");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:px-8">
        <AppNav />

        <nav className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
            Operation: Recode
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
            Account.
            <br />
            Sync your data.
          </h1>
        </nav>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Session</p>
              <p className="mt-2 text-2xl font-black">
                {userEmail ? userEmail : "Not signed in"}
              </p>
            </div>

            <div
              className={
                userEmail
                  ? "rounded-full bg-emerald-400 px-4 py-2 text-xs font-black text-zinc-950"
                  : "rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-400"
              }
            >
              {userEmail ? "ONLINE" : "OFFLINE"}
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {status}
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Sign In</p>
          <h2 className="mt-1 text-2xl font-bold">Access your cloud data</h2>

          <div className="mt-5 grid gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-xs text-zinc-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <button
                onClick={signIn}
                disabled={loading}
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                Sign In
              </button>

              <button
                onClick={signUp}
                disabled={loading}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                Create Account
              </button>

              <button
                onClick={signOut}
                disabled={loading}
                className="rounded-2xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-950 disabled:opacity-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Password Reset</p>
          <h2 className="mt-1 text-2xl font-bold">Reset by email</h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Password changes require a reset link sent to your email.
          </p>

          <button
            onClick={sendResetPasswordEmail}
            disabled={loading}
            className="mt-5 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Send Reset Link
          </button>
        </section>

        {canSetNewPassword && (
          <section className="mt-5 rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-5 md:p-6">
            <p className="text-sm text-emerald-300">Verified Reset</p>

            <h2 className="mt-1 text-2xl font-bold">Set new password</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              This section appears only after opening a valid password reset link.
            </p>

            <label className="mt-5 block">
              <span className="text-xs text-zinc-500">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="new password"
                className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <button
              onClick={saveNewPasswordFromEmailLink}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              Save New Password
            </button>
          </section>
        )}
      </section>
    </main>
  );
}