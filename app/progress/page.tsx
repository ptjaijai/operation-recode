"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";

type DailyLog = {
  id: string;
  date: string;
  weight: number;
  sleep: number;
  water: number;
  snackLevel: "none" | "low" | "medium" | "high";
  mood: "great" | "good" | "neutral" | "tired" | "bad";
  notes: string;
};

type FoodLog = {
  id: string;
  date: string;
  protein: number;
};

type WorkoutLog = {
  id: string;
  date: string;
  durationMinutes: number;
};

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  waterGoal: number;
  sleepGoal: number;
};

const storageKeys = {
  daily: "operation-recode-logs-no-waist",
  food: "operation-recode-food-logs",
  workout: "operation-recode-workout-logs",
  goals: "operation-recode-goals",
};

const defaultGoals: Goals = {
  targetWeight: 60,
  proteinGoal: 120,
  waterGoal: 2,
  sleepGoal: 7,
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

function safeParseArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

function normalizeDailyLog(raw: Record<string, unknown>): DailyLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    weight:
      typeof raw.weight === "number"
        ? raw.weight
        : typeof raw.weightKg === "number"
        ? raw.weightKg
        : 0,
    sleep:
      typeof raw.sleep === "number"
        ? raw.sleep
        : typeof raw.sleepHours === "number"
        ? raw.sleepHours
        : 0,
    water:
      typeof raw.water === "number"
        ? raw.water
        : typeof raw.waterLiters === "number"
        ? raw.waterLiters
        : 0,
    snackLevel:
      raw.snackLevel === "none" ||
      raw.snackLevel === "low" ||
      raw.snackLevel === "medium" ||
      raw.snackLevel === "high"
        ? raw.snackLevel
        : "none",
    mood:
      raw.mood === "great" ||
      raw.mood === "good" ||
      raw.mood === "neutral" ||
      raw.mood === "tired" ||
      raw.mood === "bad"
        ? raw.mood
        : "neutral",
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function normalizeFoodLog(raw: Record<string, unknown>): FoodLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    protein:
      typeof raw.protein === "number"
        ? raw.protein
        : typeof raw.proteinGrams === "number"
        ? raw.proteinGrams
        : typeof raw.proteinEstimate === "number"
        ? raw.proteinEstimate
        : 0,
  };
}

function normalizeWorkoutLog(raw: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    durationMinutes:
      typeof raw.durationMinutes === "number" ? raw.durationMinutes : 0,
  };
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function getSleepScore(sleep: number, sleepGoal: number) {
  if (sleep >= sleepGoal) return 100;
  if (sleep >= sleepGoal - 1) return 75;
  if (sleep >= sleepGoal - 2) return 45;
  if (sleep > 0) return 25;
  return 0;
}

function getWaterScore(water: number, waterGoal: number) {
  if (water >= waterGoal) return 100;
  if (water >= waterGoal * 0.8) return 80;
  if (water >= waterGoal * 0.6) return 60;
  if (water > 0) return 30;
  return 0;
}

function getSnackScore(level: DailyLog["snackLevel"]) {
  if (level === "none") return 100;
  if (level === "low") return 80;
  if (level === "medium") return 50;
  return 20;
}

function getMoodScore(mood: DailyLog["mood"]) {
  if (mood === "great") return 100;
  if (mood === "good") return 80;
  if (mood === "neutral") return 60;
  if (mood === "tired") return 40;
  return 20;
}

function getDailyScore(log: DailyLog, goals: Goals) {
  return Math.round(
    getSleepScore(log.sleep, goals.sleepGoal) * 0.35 +
      getWaterScore(log.water, goals.waterGoal) * 0.3 +
      getSnackScore(log.snackLevel) * 0.25 +
      getMoodScore(log.mood) * 0.1
  );
}

function getTrendText({
  latestWeight,
  firstWeight,
  targetWeight,
}: {
  latestWeight: number;
  firstWeight: number;
  targetWeight: number;
}) {
  if (!latestWeight || !firstWeight) {
    return "Not enough weight data yet. Start by saving weight in Daily Check-in.";
  }

  const change = latestWeight - firstWeight;
  const left = latestWeight - targetWeight;

  if (latestWeight <= targetWeight) {
    return "Target reached. Now focus on maintaining, protein, and strength.";
  }

  if (change < -0.5) {
    return `${Math.abs(change).toFixed(
      1
    )} kg down from first log. Good trend. About ${left.toFixed(
      1
    )} kg left to target.`;
  }

  if (change > 0.5) {
    return `${change.toFixed(
      1
    )} kg up from first log. Check snacks, sweet drinks, late-night eating, and weekend meals.`;
  }

  return `Weight is mostly stable. About ${left.toFixed(
    1
  )} kg left to target. Keep collecting data.`;
}

export default function ProgressPage() {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  useEffect(() => {
    const savedDaily = safeParseArray<Record<string, unknown>>(
      localStorage.getItem(storageKeys.daily)
    );

    const savedFood = safeParseArray<Record<string, unknown>>(
      localStorage.getItem(storageKeys.food)
    );

    const savedWorkout = safeParseArray<Record<string, unknown>>(
      localStorage.getItem(storageKeys.workout)
    );

    setGoals(loadGoals());
    setDailyLogs(savedDaily.map((item) => normalizeDailyLog(item)));
    setFoodLogs(savedFood.map((item) => normalizeFoodLog(item)));
    setWorkoutLogs(savedWorkout.map((item) => normalizeWorkoutLog(item)));
  }, []);

  const weightLogs = useMemo(() => {
    return dailyLogs
      .filter((log) => log.weight > 0)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyLogs]);

  const latestWeight = weightLogs[weightLogs.length - 1]?.weight ?? 0;
  const firstWeight = weightLogs[0]?.weight ?? 0;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;
  const weightLeft = latestWeight ? Math.max(latestWeight - goals.targetWeight, 0) : 0;

  const last7Weights = weightLogs.slice(-7);
  const avg7 =
    last7Weights.length > 0
      ? last7Weights.reduce((sum, log) => sum + log.weight, 0) / last7Weights.length
      : 0;

  const last14Daily = dailyLogs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const last7Dates = Array.from(
    new Set([
      ...dailyLogs.map((log) => log.date),
      ...foodLogs.map((log) => log.date),
      ...workoutLogs.map((log) => log.date),
    ])
  )
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);

  const weeklyProtein = last7Dates.reduce((sum, date) => {
    const dayProtein = foodLogs
      .filter((log) => log.date === date)
      .reduce((total, log) => total + log.protein, 0);

    return sum + dayProtein;
  }, 0);

  const weeklyWorkoutMinutes = last7Dates.reduce((sum, date) => {
    const dayMinutes = workoutLogs
      .filter((log) => log.date === date)
      .reduce((total, log) => total + log.durationMinutes, 0);

    return sum + dayMinutes;
  }, 0);

  const avgProtein =
    last7Dates.length > 0 ? Math.round(weeklyProtein / last7Dates.length) : 0;

  const maxWeight = Math.max(...weightLogs.map((log) => log.weight), 1);
  const minWeight = Math.min(...weightLogs.map((log) => log.weight), 0);
  const range = Math.max(maxWeight - minWeight, 1);

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
              Progress.
              <br />
              See the trend.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Progress / v0.3
          </div>
        </nav>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <p className="text-sm text-zinc-400">Weight Goal</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <BigGoalCard
                label="Current"
                value={latestWeight ? latestWeight.toFixed(1) : "-"}
                unit="kg"
                note="latest log"
              />

              <BigGoalCard
                label="Target"
                value={goals.targetWeight.toFixed(1)}
                unit="kg"
                note="from settings"
                highlight
              />

              <BigGoalCard
                label="To Go"
                value={latestWeight ? weightLeft.toFixed(1) : "-"}
                unit="kg"
                note={latestWeight ? "left to target" : "waiting for data"}
              />
            </div>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Trend comment</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {getTrendText({
                  latestWeight,
                  firstWeight,
                  targetWeight: goals.targetWeight,
                })}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <StatCard label="7-day Avg" value={avg7 ? `${avg7.toFixed(1)} kg` : "-"} />
            <StatCard
              label="Avg Protein"
              value={`${avgProtein}g`}
              note={`Goal ${goals.proteinGoal}g`}
            />
            <StatCard label="Workout / 7 days" value={`${weeklyWorkoutMinutes} min`} />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Weight Trend</p>
          <h2 className="mt-1 text-2xl font-bold">Weight logs</h2>

          <div className="mt-5 grid gap-3">
            {weightLogs.length === 0 ? (
              <EmptyText text="No weight data yet" />
            ) : (
              weightLogs
                .slice()
                .reverse()
                .slice(0, 14)
                .map((log) => {
                  const width = ((log.weight - minWeight) / range) * 80 + 20;

                  return (
                    <div
                      key={log.id}
                      className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[100px_90px_1fr] md:items-center"
                    >
                      <p className="font-bold">{formatDate(log.date)}</p>
                      <p className="text-zinc-300">{log.weight.toFixed(1)} kg</p>

                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Daily Score History</p>
          <h2 className="mt-1 text-2xl font-bold">Last check-ins</h2>

          <div className="mt-5 grid gap-3">
            {last14Daily.length === 0 ? (
              <EmptyText text="No daily check-ins yet" />
            ) : (
              last14Daily.map((log) => {
                const score = getDailyScore(log, goals);

                return (
                  <div
                    key={log.id}
                    className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[100px_90px_1fr_90px] md:items-center"
                  >
                    <p className="font-bold">{formatDate(log.date)}</p>
                    <p className="text-zinc-300">{score}/100</p>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    <p className="text-zinc-500">{log.mood}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function BigGoalCard({
  label,
  value,
  unit,
  note,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl border border-emerald-400/50 bg-emerald-400/10 p-5"
          : "rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
      }
    >
      <p className={highlight ? "text-sm text-emerald-300" : "text-sm text-zinc-500"}>
        {label}
      </p>

      <p className="mt-3 text-5xl font-black tracking-tight md:text-6xl">
        {value}
        <span className="ml-1 text-xl text-zinc-500">{unit}</span>
      </p>

      <p className="mt-3 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      {note && <p className="mt-2 text-sm text-zinc-500">{note}</p>}
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-500">
      {text}
    </div>
  );
}