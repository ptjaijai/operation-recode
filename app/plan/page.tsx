"use client";

import { useEffect, useState } from "react";
import AppNav from "../AppNav";

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  waterGoal: number;
  sleepGoal: number;
};

const storageKeys = {
  goals: "operation-recode-goals",
};

const defaultGoals: Goals = {
  targetWeight: 60,
  proteinGoal: 120,
  waterGoal: 2,
  sleepGoal: 7,
};

function loadGoals(): Goals {
  const saved = localStorage.getItem(storageKeys.goals);

  if (!saved) return defaultGoals;

  try {
    const parsed = JSON.parse(saved) as Partial<Goals>;

    return {
      targetWeight:
        typeof parsed.targetWeight === "number"
          ? parsed.targetWeight
          : defaultGoals.targetWeight,
      proteinGoal:
        typeof parsed.proteinGoal === "number"
          ? parsed.proteinGoal
          : defaultGoals.proteinGoal,
      waterGoal:
        typeof parsed.waterGoal === "number"
          ? parsed.waterGoal
          : defaultGoals.waterGoal,
      sleepGoal:
        typeof parsed.sleepGoal === "number"
          ? parsed.sleepGoal
          : defaultGoals.sleepGoal,
    };
  } catch {
    return defaultGoals;
  }
}

export default function PlanPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <nav className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
              Operation: Recode
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
              Plan.
              <br />
              Do the basics.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Plan / v0.1
          </div>
        </nav>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-6 md:p-8">
            <p className="text-sm text-emerald-300">Today Focus</p>
            <h2 className="mt-2 text-4xl font-black">
              ลดน้ำหนัก แต่ไม่เสียกล้าม
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              วันนี้ไม่ต้อง perfect แค่ทำ 4 อย่างให้ครบ: โปรตีน น้ำ ขยับตัว และนอน
            </p>

            <div className="mt-6 grid gap-3">
              <Mission text={`Hit protein around ${goals.proteinGoal}g`} />
              <Mission text={`Drink water around ${goals.waterGoal}L`} />
              <Mission text="Move or train at least 30 minutes" />
              <Mission text={`Sleep close to ${goals.sleepGoal} hours`} />
            </div>
          </div>

          <div className="grid gap-3">
            <GoalCard label="Target Weight" value={`${goals.targetWeight} kg`} />
            <GoalCard label="Protein Goal" value={`${goals.proteinGoal}g`} />
            <GoalCard label="Water Goal" value={`${goals.waterGoal}L`} />
            <GoalCard label="Sleep Goal" value={`${goals.sleepGoal}h`} />
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <PlanCard
            title="Food Plan"
            tag="ง่ายสุด"
            items={[
              "มื้อแรกต้องมีโปรตีนก่อน",
              "ถ้ากินเวย์ นับประมาณ 20–30g",
              "น้ำหวานให้เลือก zero หรือไม่กิน",
              "ถ้าหิวดึก ให้กินโปรตีนก่อนขนม",
            ]}
          />

          <PlanCard
            title="Workout Plan"
            tag="ไม่ต้องหนัก"
            items={[
              "ถ้าวันนี้ตีแบด = ถือว่า workout แล้ว",
              "ถ้าไม่ได้ตีแบด ให้เดิน 30 นาที",
              "ถ้าอยู่บ้าน ทำ push-up / squat / plank",
              "อย่าให้ไม่มี movement ทั้งวัน",
            ]}
          />

          <PlanCard
            title="Recovery Plan"
            tag="ตัวเปลี่ยนเกม"
            items={[
              "นอนน้อย = หิว/อยากของหวานง่าย",
              "พยายามปิดจอก่อนนอนนิดนึง",
              "ถ้าเหนื่อยมาก ไม่ต้องซ้อมหนัก",
              "วันนี้หลุดได้ แต่ห้ามปล่อยยาว",
            ]}
          />
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Quick Route</p>
          <h2 className="mt-1 text-2xl font-bold">Log what you did</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <QuickLink href="/" label="Daily Check-in" />
            <QuickLink href="/food" label="Log Food" />
            <QuickLink href="/workout" label="Log Workout" />
            <QuickLink href="/coach" label="Ask Coach" />
          </div>
        </section>
      </section>
    </main>
  );
}

function Mission({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/70 p-4 text-sm font-bold text-zinc-100">
      {text}
    </div>
  );
}

function GoalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function PlanCard({
  title,
  tag,
  items,
}: {
  title: string;
  tag: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          {tag}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-black text-zinc-950 hover:bg-emerald-300"
    >
      {label}
    </a>
  );
}