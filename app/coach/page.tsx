"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";

type AnyLog = Record<string, unknown>;

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

function formatDateForMenu(dateString: string) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function shiftDate(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  return getLocalDateString(date);
}

function readArray(key: string): AnyLog[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getString(log: AnyLog | undefined, keys: string[], fallback = "") {
  if (!log) return fallback;

  for (const key of keys) {
    const value = log[key];

    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function getNumber(log: AnyLog | undefined, keys: string[], fallback = 0) {
  if (!log) return fallback;

  for (const key of keys) {
    const value = log[key];

    if (typeof value === "number" && !Number.isNaN(value)) return value;

    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return fallback;
}

function getBoolean(log: AnyLog | undefined, keys: string[]) {
  if (!log) return false;

  for (const key of keys) {
    const value = log[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "yes") return true;
    }
  }

  return false;
}

function getDate(log: AnyLog) {
  return getString(log, ["date"], "");
}

function getProtein(log: AnyLog) {
  return getNumber(log, ["protein", "proteinGrams", "proteinEstimate"], 0);
}

function getWorkoutMinutes(log: AnyLog) {
  return getNumber(log, ["durationMinutes", "duration", "minutes"], 0);
}

function getWorkoutType(log: AnyLog) {
  return getString(log, ["type", "workoutType"], "");
}

function getWeight(log: AnyLog) {
  return getNumber(log, ["weight", "weightKg"], 0);
}

function getSleep(log: AnyLog | undefined) {
  return getNumber(log, ["sleep", "sleepHours", "hoursSleep"], 0);
}

function getWater(log: AnyLog | undefined) {
  return getNumber(log, ["water", "waterLiters", "waterL"], 0);
}

function getSnackLevel(log: AnyLog | undefined) {
  return getString(log, ["snackLevel", "snack", "snacks"], "");
}

function scoreProtein(protein: number) {
  if (protein >= 120) return 100;
  if (protein >= 100) return 85;
  if (protein >= 80) return 65;
  if (protein >= 60) return 45;
  if (protein > 0) return 25;
  return 0;
}

function scoreWorkout(minutes: number, hasHomeWorkout: boolean) {
  if (minutes >= 180) return 100;
  if (hasHomeWorkout && minutes >= 20) return 90;
  if (minutes >= 60) return 75;
  if (minutes >= 30) return 60;
  if (minutes >= 15) return 40;
  return 0;
}

function scoreRecovery(sleep: number, water: number, snackLevel: string) {
  const sleepScore =
    sleep >= 7 ? 100 : sleep >= 6 ? 75 : sleep >= 5 ? 45 : sleep > 0 ? 25 : 0;

  const waterScore =
    water >= 2.5 ? 100 : water >= 2 ? 80 : water >= 1.5 ? 60 : water > 0 ? 30 : 0;

  const snack = snackLevel.toLowerCase();

  const snackScore =
    snack.includes("none") ||
    snack.includes("low") ||
    snack.includes("น้อย") ||
    snack.includes("ไม่")
      ? 100
      : snack.includes("medium") || snack.includes("กลาง")
      ? 60
      : snack.includes("high") || snack.includes("เยอะ")
      ? 20
      : 50;

  return Math.round(sleepScore * 0.4 + waterScore * 0.35 + snackScore * 0.25);
}

function getCoachVerdict({
  protein,
  workoutMinutes,
  hasHomeWorkout,
  sleep,
  water,
  sweetDrinks,
  junkCount,
  hasCheckIn,
}: {
  protein: number;
  workoutMinutes: number;
  hasHomeWorkout: boolean;
  sleep: number;
  water: number;
  sweetDrinks: number;
  junkCount: number;
  hasCheckIn: boolean;
}) {
  if (!hasCheckIn) {
    return "Start with Daily Check-in first. Coach still needs sleep, water, and snack data.";
  }

  if (protein < 80) {
    return "Priority today is protein. Still too low. Push closer to 100–120g so you can lose weight without looking flat.";
  }

  if (workoutMinutes === 0) {
    return "No workout logged today. If there is no badminton, do a 15–20 minute Home Workout.";
  }

  if (!hasHomeWorkout && workoutMinutes > 0) {
    return "Cardio is in, but resistance training is missing. Add Home Workout 2–3 days/week for a sharper body.";
  }

  if (sweetDrinks > 0 || junkCount > 0) {
    return "There is some sweet drink or junk food today. Keep the next meal clean. Do not punish yourself by starving.";
  }

  if (sleep < 6) {
    return "Sleep is low. Expect more cravings today. The mission is to sleep a bit earlier tonight.";
  }

  if (water < 2) {
    return "Water is still low. Push it to at least 2L to help hunger control and recovery.";
  }

  return "Overall looks good today. Repeat this for multiple days and the weight trend should become more stable.";
}

function getWeightMessage(latestWeight: number, previousWeight: number) {
  if (!latestWeight) return "No latest weight log yet.";

  if (!previousWeight) return "Latest weight exists. Add one more day to start seeing the trend.";

  const diff = latestWeight - previousWeight;

  if (diff <= -0.3) return `Down ${Math.abs(diff).toFixed(1)} kg. Good, but do not rush too hard.`;
  if (diff >= 0.3) return `Up ${diff.toFixed(1)} kg. Do not panic. It can be water, sodium, or food volume.`;

  return "Weight is quite stable. The 7-day average matters more than one single day.";
}

export default function CoachPage() {
  const [checkInLogs, setCheckInLogs] = useState<AnyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<AnyLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<AnyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setCheckInLogs(readArray("operation-recode-logs-no-waist"));
    setFoodLogs(readArray("operation-recode-food-logs"));
    setWorkoutLogs(readArray("operation-recode-workout-logs"));
  }, []);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    dates.add(today);

    checkInLogs.forEach((log) => {
      const date = getDate(log);
      if (date) dates.add(date);
    });

    foodLogs.forEach((log) => {
      const date = getDate(log);
      if (date) dates.add(date);
    });

    workoutLogs.forEach((log) => {
      const date = getDate(log);
      if (date) dates.add(date);
    });

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [checkInLogs, foodLogs, workoutLogs]);

  const data = useMemo(() => {
    const todayCheckIn = checkInLogs.find((log) => getDate(log) === selectedDate);

    const todayFood = foodLogs.filter((log) => getDate(log) === selectedDate);
    const todayWorkout = workoutLogs.filter((log) => getDate(log) === selectedDate);

    const protein = todayFood.reduce((sum, log) => sum + getProtein(log), 0);

    const sweetDrinks = todayFood.filter((log) =>
      getBoolean(log, ["sweetDrink", "hasSweetDrink", "isSweetDrink"])
    ).length;

    const junkCount = todayFood.filter((log) =>
      getBoolean(log, ["junkFood", "hasJunkFood", "isJunkFood"])
    ).length;

    const workoutMinutes = todayWorkout.reduce(
      (sum, log) => sum + getWorkoutMinutes(log),
      0
    );

    const hasHomeWorkout = todayWorkout.some(
      (log) => getWorkoutType(log) === "home-workout"
    );

    const hasBadminton = todayWorkout.some(
      (log) => getWorkoutType(log) === "badminton"
    );

    const sleep = getSleep(todayCheckIn);
    const water = getWater(todayCheckIn);
    const snackLevel = getSnackLevel(todayCheckIn);

    const proteinScore = scoreProtein(protein);
    const workoutScore = scoreWorkout(workoutMinutes, hasHomeWorkout);
    const recoveryScore = scoreRecovery(sleep, water, snackLevel);

    const overallScore = Math.round(
      proteinScore * 0.4 + workoutScore * 0.35 + recoveryScore * 0.25
    );

    const weightLogs = checkInLogs
      .filter((log) => getWeight(log) > 0)
      .slice()
      .sort((a, b) => getDate(a).localeCompare(getDate(b)));

    const latestWeightLog = weightLogs[weightLogs.length - 1];
    const previousWeightLog = weightLogs[weightLogs.length - 2];

    const latestWeight = getWeight(latestWeightLog ?? {});
    const previousWeight = getWeight(previousWeightLog ?? {});

    const last7Weights = weightLogs.slice(-7).map((log) => getWeight(log));

    const avg7 =
      last7Weights.length > 0
        ? last7Weights.reduce((sum, weight) => sum + weight, 0) / last7Weights.length
        : 0;

    const verdict = getCoachVerdict({
      protein,
      workoutMinutes,
      hasHomeWorkout,
      sleep,
      water,
      sweetDrinks,
      junkCount,
      hasCheckIn: Boolean(todayCheckIn),
    });

    return {
      todayCheckIn,
      todayFood,
      todayWorkout,
      protein,
      sweetDrinks,
      junkCount,
      workoutMinutes,
      hasHomeWorkout,
      hasBadminton,
      sleep,
      water,
      snackLevel,
      proteinScore,
      workoutScore,
      recoveryScore,
      overallScore,
      latestWeight,
      previousWeight,
      avg7,
      verdict,
    };
  }, [checkInLogs, foodLogs, workoutLogs, selectedDate]);

  const proteinLeft = Math.max(120 - data.protein, 0);
  const waterLeft = Math.max(2 - data.water, 0);

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
              Coach Room.
              <br />
              What matters today.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Coach / v1.1
          </div>
        </nav>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Daily Coach</p>
                <h2 className="mt-1 text-2xl font-bold">Select Date</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
                >
                  ← Prev
                </button>

                <button
                  onClick={() => setSelectedDate(today)}
                  className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
                >
                  Today
                </button>

                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
                >
                  Next →
                </button>

                <select
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date === today ? "Today — " : ""}
                      {formatDateForMenu(date)}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Today Score</p>
              <p className="mt-2 text-6xl font-black">
                {data.overallScore}
                <span className="text-xl text-zinc-500"> / 100</span>
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${data.overallScore}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-300">{data.verdict}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniScore label="Protein" score={data.proteinScore} />
              <MiniScore label="Workout" score={data.workoutScore} />
              <MiniScore label="Recovery" score={data.recoveryScore} />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Body Trend</p>
            <h2 className="mt-1 text-2xl font-bold">Weight signal</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <StatCard
                label="Latest"
                value={data.latestWeight ? `${data.latestWeight.toFixed(1)} kg` : "-"}
                note="latest log"
              />

              <StatCard
                label="7-day avg"
                value={data.avg7 ? `${data.avg7.toFixed(1)} kg` : "-"}
                note="more stable"
              />

              <StatCard label="Target" value="60 kg" note="recode goal" />
            </div>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Coach note</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {getWeightMessage(data.latestWeight, data.previousWeight)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-4">
          <MissionCard
            title="Protein Mission"
            value={`${data.protein} / 120g`}
            detail={
              proteinLeft > 0
                ? `About ${proteinLeft}g left today`
                : "Target reached. Good."
            }
          />

          <MissionCard
            title="Workout Mission"
            value={`${data.workoutMinutes} min`}
            detail={
              data.workoutMinutes === 0
                ? "No workout logged yet"
                : data.hasHomeWorkout
                ? "Resistance training done"
                : "Cardio logged, but no Home Workout yet"
            }
          />

          <MissionCard
            title="Water Mission"
            value={`${data.water} L`}
            detail={
              waterLeft > 0
                ? `Drink ${waterLeft.toFixed(1)} L more`
                : "Water looks good"
            }
          />

          <MissionCard
            title="Snack Control"
            value={`${data.sweetDrinks + data.junkCount}`}
            detail="Sweet drink + junk food count today"
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Food Today</p>
            <h3 className="mt-1 text-2xl font-bold">What you ate</h3>

            <div className="mt-5 grid gap-3">
              {data.todayFood.length === 0 ? (
                <Empty text="No food log for this date" />
              ) : (
                data.todayFood
                  .slice()
                  .reverse()
                  .map((log, index) => (
                    <div key={index} className="rounded-2xl bg-zinc-950 p-4 text-sm">
                      <p className="font-bold">
                        {getString(log, ["foodName", "name", "food"], "Food")}
                      </p>
                      <p className="mt-1 text-zinc-500">Protein {getProtein(log)}g</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Workout Today</p>
            <h3 className="mt-1 text-2xl font-bold">Training log</h3>

            <div className="mt-5 grid gap-3">
              {data.todayWorkout.length === 0 ? (
                <Empty text="No workout log for this date" />
              ) : (
                data.todayWorkout
                  .slice()
                  .reverse()
                  .map((log, index) => (
                    <div key={index} className="rounded-2xl bg-zinc-950 p-4 text-sm">
                      <p className="font-bold">{getWorkoutType(log) || "Workout"}</p>
                      <p className="mt-1 text-zinc-500">
                        {getWorkoutMinutes(log)} minutes
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function MiniScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{score}</p>
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
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function MissionCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{detail}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-500">{text}</div>;
}