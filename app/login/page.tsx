"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? "");
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? "");
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      alert("ใส่ email และ password ก่อน");
      return;
    }

    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Sign up สำเร็จ ถ้า Supabase ให้ confirm email ให้ไปกดยืนยันใน email ก่อน");
  }

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      alert("ใส่ email และ password ก่อน");
      return;
    }

    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Login สำเร็จ กำลังไปหน้า Dashboard...");
    window.location.href = "/";
  }

  async function signOut() {
    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setUserEmail("");
    setStatus("Logged out");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8">
        <div className="grid w-full gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
              Operation: Recode
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Login.
              <br />
              Sync the system.
            </h1>

            <p className="mt-5 text-sm leading-6 text-zinc-300">
              Login จะทำให้ข้อมูลไปอยู่ใน database และต่อไปใช้ข้ามคอม/มือถือได้
              ไม่ต้องผูกกับ browser เครื่องเดียว
            </p>

            <div className="mt-6 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Current status</p>

              {userEmail ? (
                <>
                  <p className="mt-2 text-2xl font-black text-emerald-300">
                    Logged in
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">{userEmail}</p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-2xl font-black text-zinc-200">
                    Not logged in
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Sign up หรือ Sign in ก่อนเริ่ม sync ข้อมูล
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Account</p>
            <h2 className="mt-1 text-2xl font-bold">Sign in / Sign up</h2>

            <div className="mt-5 grid gap-3">
              <label className="block">
                <span className="text-xs text-zinc-500">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <label className="block">
                <span className="text-xs text-zinc-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="อย่างน้อย 6 ตัว"
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                Sign Up
              </button>
            </div>

            {userEmail && (
              <button
                onClick={signOut}
                disabled={loading}
                className="mt-3 w-full rounded-2xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-950 disabled:opacity-50"
              >
                Sign Out
              </button>
            )}

            {status && (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">
                {status}
              </div>
            )}

            <a
              href="/"
              className="mt-4 block rounded-2xl border border-zinc-800 px-4 py-3 text-center text-sm font-bold text-zinc-300 hover:bg-zinc-800"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}