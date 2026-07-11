"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";

type SnackLevel = "none" | "low" | "medium" | "high";
type MoodLevel = "great" | "good" | "neutral" | "tired" | "bad";

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  calorieGoal: number;
  waterGoal: number;
  sleepGoal: number;
  workoutGoal: number;
};

type DailyLog = {
  date: string;
  weight: number;
  sleep: number;
  water: number;
  snackLevel: SnackLevel;
  mood: MoodLevel;
  notes: string;
};

type FoodLog = {
  id: string;
  date: string;
  foodName: string;
  protein: number;
  calories: number;
  sweetDrink: boolean;
  junkFood: boolean;
};

type WorkoutLog = {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  estimatedCalories: number;
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
  calorieGoal: 1800,
  waterGoal: 2,
  sleepGoal: 7,
  workoutGoal: 30,
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function safeParseArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSnackLevel(value: unknown): SnackLevel {
  if (value === "none" || value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "none";
}

function normalizeMood(value: unknown): MoodLevel {
  if (
    value === "great" ||
    value === "good" ||
    value === "neutral" ||
    value === "tired" ||
    value === "bad"
  ) {
    return value;
  }

  return "neutral";
}

function loadLocalGoals(): Goals {
  const saved = localStorage.getItem(storageKeys.goals);

  if (!saved) return defaultGoals;

  try {
    const parsed = JSON.parse(saved) as Partial<Goals>;

    return {
      targetWeight: toNumber(parsed.targetWeight, defaultGoals.targetWeight),
      proteinGoal: toNumber(parsed.proteinGoal, defaultGoals.proteinGoal),
      calorieGoal: toNumber(parsed.calorieGoal, defaultGoals.calorieGoal),
      waterGoal: toNumber(parsed.waterGoal, defaultGoals.waterGoal),
      sleepGoal: toNumber(parsed.sleepGoal, defaultGoals.sleepGoal),
      workoutGoal: toNumber(parsed.workoutGoal, defaultGoals.workoutGoal),
    };
  } catch {
    return defaultGoals;
  }
}

function goalsFromDatabase(row: Record<string, unknown>): Goals {
  return {
    targetWeight: toNumber(row.target_weight, defaultGoals.targetWeight),
    proteinGoal: toNumber(row.protein_goal, defaultGoals.proteinGoal),
    calorieGoal: toNumber(row.calorie_goal, defaultGoals.calorieGoal),
    waterGoal: toNumber(row.water_goal, defaultGoals.waterGoal),
    sleepGoal: toNumber(row.sleep_goal, defaultGoals.sleepGoal),
    workoutGoal: toNumber(row.workout_goal, defaultGoals.workoutGoal),
  };
}

function normalizeDailyLog(raw: Record<string, unknown>): DailyLog {
  return {
    date: typeof raw.date === "string" ? raw.date : today,
    weight: toNumber(raw.weight ?? raw.weightKg, 0),
    sleep: toNumber(raw.sleep ?? raw.sleepHours, 0),
    water: toNumber(raw.water ?? raw.waterLiters, 0),
    snackLevel: normalizeSnackLevel(raw.snackLevel),
    mood: normalizeMood(raw.mood),
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function databaseToDailyLog(row: Record<string, unknown>): DailyLog {
  return {
    date: typeof row.date === "string" ? row.date : today,
    weight: toNumber(row.weight, 0),
    sleep: toNumber(row.sleep, 0),
    water: toNumber(row.water, 0),
    snackLevel: normalizeSnackLevel(row.snack_level),
    mood: normalizeMood(row.mood),
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function normalizeFoodLog(raw: Record<string, unknown>): FoodLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    foodName:
      typeof raw.foodName === "string"
        ? raw.foodName
        : typeof raw.food === "string"
        ? raw.food
        : typeof raw.name === "string"
        ? raw.name
        : "",
    protein: toNumber(raw.protein ?? raw.proteinGrams, 0),
    calories: toNumber(raw.calories ?? raw.kcal, 0),
    sweetDrink:
      typeof raw.sweetDrink === "boolean"
        ? raw.sweetDrink
        : typeof raw.hasSweetDrink === "boolean"
        ? raw.hasSweetDrink
        : false,
    junkFood:
      typeof raw.junkFood === "boolean"
        ? raw.junkFood
        : typeof raw.hasJunkFood === "boolean"
        ? raw.hasJunkFood
        : false,
  };
}

function databaseToFoodLog(row: Record<string, unknown>): FoodLog {
  return {
    id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
    date: typeof row.date === "string" ? row.date : today,
    foodName: typeof row.food_name === "string" ? row.food_name : "",
    protein: toNumber(row.protein, 0),
    calories: toNumber(row.calories, 0),
    sweetDrink: row.sweet_drink === true,
    junkFood: row.junk_food === true,
  };
}

function normalizeWorkoutLog(raw: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    type: typeof raw.type === "string" ? raw.type : "other",
    durationMinutes: toNumber(raw.durationMinutes ?? raw.duration_minutes, 0),
    estimatedCalories: toNumber(raw.estimatedCalories ?? raw.estimated_calories, 0),
  };
}

function databaseToWorkoutLog(row: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
    date: typeof row.date === "string" ? row.date : today,
    type: typeof row.type === "string" ? row.type : "other",
    durationMinutes: toNumber(row.duration_minutes, 0),
    estimatedCalories: toNumber(row.estimated_calories, 0),
  };
}

function mergeByDate(localLogs: DailyLog[], cloudLogs: DailyLog[]) {
  const map = new Map<string, DailyLog>();

  cloudLogs.forEach((log) => map.set(log.date, log));
  localLogs.forEach((log) => map.set(log.date, log));

  return Array.from(map.values());
}

function mergeById<T extends { id: string }>(localLogs: T[], cloudLogs: T[]) {
  const map = new Map<string, T>();

  cloudLogs.forEach((log) => map.set(log.id, log));
  localLogs.forEach((log) => map.set(log.id, log));

  return Array.from(map.values());
}

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

function getMainPriority({
  dailyLog,
  protein,
  proteinGoal,
  calories,
  calorieGoal,
  workoutMinutes,
  workoutGoal,
  water,
  waterGoal,
  sleep,
  sleepGoal,
}: {
  dailyLog?: DailyLog;
  protein: number;
  proteinGoal: number;
  calories: number;
  calorieGoal: number;
  workoutMinutes: number;
  workoutGoal: number;
  water: number;
  waterGoal: number;
  sleep: number;
  sleepGoal: number;
}) {
  if (!dailyLog) return "Log your Daily Check-in first.";
  if (sleep > 0 && sleep < sleepGoal - 1) return "Recovery first: sleep is low today.";
  if (water < waterGoal) return "Drink water before judging hunger.";
  if (protein < proteinGoal * 0.65) return "Protein is the main target now.";
  if (calories > calorieGoal) return "Calories are over. Keep next meal clean.";
  if (workoutMinutes < workoutGoal) return "Movement is still missing.";
  return "Good baseline. Protect the day and avoid random snacks.";
}

function getCalorieStatus(totalCalories: number, calorieGoal: number) {
  const diff = calorieGoal - totalCalories;

  if (totalCalories === 0) return "No food logged";
  if (diff > 0) return `${diff} kcal left`;
  if (diff === 0) return "On target";

  return `${Math.abs(diff)} kcal over`;
}

function getNetCalorieStatus(netCalories: number, calorieGoal: number) {
  const diff = calorieGoal - netCalories;

  if (netCalories === 0) return "No net data yet";
  if (diff > 0) return `${diff} kcal net room`;
  if (diff === 0) return "Net on target";

  return `${Math.abs(diff)} kcal net over`;
}

export default function PlanPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [syncStatus, setSyncStatus] = useState("Loading plan data...");

  useEffect(() => {
    async function loadPlanData() {
      const localGoals = loadLocalGoals();
      const localDailyLogs = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.daily)
      ).map((item) => normalizeDailyLog(item));

      const localFoodLogs = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.food)
      ).map((item) => normalizeFoodLog(item));

      const localWorkoutLogs = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.workout)
      ).map((item) => normalizeWorkoutLog(item));

      setGoals(localGoals);
      setDailyLogs(localDailyLogs);
      setFoodLogs(localFoodLogs);
      setWorkoutLogs(localWorkoutLogs);

      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setSyncStatus("Not logged in. Plan is using local data only.");
          return;
        }

        setSyncStatus("Loading cloud plan data...");

        const [goalsResult, dailyResult, foodResult, workoutResult] =
          await Promise.all([
            supabase
              .from("goals")
              .select("*")
              .eq("user_id", userData.user.id)
              .maybeSingle(),
            supabase
              .from("daily_logs")
              .select("*")
              .eq("user_id", userData.user.id),
            supabase
              .from("food_logs")
              .select("*")
              .eq("user_id", userData.user.id),
            supabase
              .from("workout_logs")
              .select("*")
              .eq("user_id", userData.user.id),
          ]);

        if (goalsResult.data) {
          const cloudGoals = goalsFromDatabase(goalsResult.data);
          setGoals(cloudGoals);
          localStorage.setItem(storageKeys.goals, JSON.stringify(cloudGoals));
        }

        if (dailyResult.error || foodResult.error || workoutResult.error) {
          setSyncStatus("Some cloud data could not be loaded. Using available data.");
          return;
        }

        const cloudDaily = (dailyResult.data ?? []).map((item) =>
          databaseToDailyLog(item as Record<string, unknown>)
        );

        const cloudFood = (foodResult.data ?? []).map((item) =>
          databaseToFoodLog(item as Record<string, unknown>)
        );

        const cloudWorkout = (workoutResult.data ?? []).map((item) =>
          databaseToWorkoutLog(item as Record<string, unknown>)
        );

        const mergedDaily = mergeByDate(localDailyLogs, cloudDaily);
        const mergedFood = mergeById(localFoodLogs, cloudFood);
        const mergedWorkout = mergeById(localWorkoutLogs, cloudWorkout);

        setDailyLogs(mergedDaily);
        setFoodLogs(mergedFood);
        setWorkoutLogs(mergedWorkout);

        localStorage.setItem(storageKeys.daily, JSON.stringify(mergedDaily));
        localStorage.setItem(storageKeys.food, JSON.stringify(mergedFood));
        localStorage.setItem(storageKeys.workout, JSON.stringify(mergedWorkout));

        setSyncStatus("Plan data loaded from Supabase.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadPlanData();
  }, []);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    dates.add(today);
    dailyLogs.forEach((log) => dates.add(log.date));
    foodLogs.forEach((log) => dates.add(log.date));
    workoutLogs.forEach((log) => dates.add(log.date));

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [dailyLogs, foodLogs, workoutLogs]);

  const dailyLog = dailyLogs.find((log) => log.date === selectedDate);
  const selectedFoodLogs = foodLogs.filter((log) => log.date === selectedDate);
  const selectedWorkoutLogs = workoutLogs.filter((log) => log.date === selectedDate);

  const totalProtein = selectedFoodLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCalories = selectedFoodLogs.reduce((sum, log) => sum + log.calories, 0);
  const sweetDrinkCount = selectedFoodLogs.filter((log) => log.sweetDrink).length;
  const junkFoodCount = selectedFoodLogs.filter((log) => log.junkFood).length;

  const totalWorkoutMinutes = selectedWorkoutLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );

  const totalBurn = selectedWorkoutLogs.reduce(
    (sum, log) => sum + log.estimatedCalories,
    0
  );

  const netCalories = totalCalories - totalBurn;

  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);
  const water = dailyLog?.water ?? 0;
  const sleep = dailyLog?.sleep ?? 0;

  const missionList = [
    {
      title: "Daily Check-in",
      done: Boolean(dailyLog),
      detail: dailyLog ? "Baseline saved" : "Go to Dashboard and save todayโ€s check-in",
      href: "/",
    },
    {
      title: "Protein",
      done: totalProtein >= goals.proteinGoal,
      detail:
        proteinLeft > 0
          ? `${proteinLeft}g protein left`
          : "Protein target reached",
      href: "/food",
    },
    {
      title: "Calories",
      done: totalCalories > 0 && totalCalories <= goals.calorieGoal,
      detail: getCalorieStatus(totalCalories, goals.calorieGoal),
      href: "/food",
    },
    {
      title: "Net Calories",
      done: netCalories > 0 && netCalories <= goals.calorieGoal,
      detail: getNetCalorieStatus(netCalories, goals.calorieGoal),
      href: "/food",
    },
    {
      title: "Workout",
      done: totalWorkoutMinutes >= goals.workoutGoal,
      detail:
        totalWorkoutMinutes >= goals.workoutGoal
          ? "Workout target reached"
          : `${Math.max(goals.workoutGoal - totalWorkoutMinutes, 0)} min left`,
      href: "/workout",
    },
    {
      title: "Water",
      done: water >= goals.waterGoal,
      detail:
        water >= goals.waterGoal
          ? "Water target reached"
          : `${Math.max(goals.waterGoal - water, 0).toFixed(1)}L left`,
      href: "/",
    },
    {
      title: "Sleep",
      done: sleep >= goals.sleepGoal,
      detail:
        sleep >= goals.sleepGoal
          ? "Sleep target reached"
          : sleep > 0
          ? `${Math.max(goals.sleepGoal - sleep, 0).toFixed(1)}h short`
          : "No sleep logged",
      href: "/",
    },
  ];

  const completedMissions = missionList.filter((mission) => mission.done).length;
  const missionScore = Math.round((completedMissions / missionList.length) * 100);

  const mainPriority = getMainPriority({
    dailyLog,
    protein: totalProtein,
    proteinGoal: goals.proteinGoal,
    calories: totalCalories,
    calorieGoal: goals.calorieGoal,
    workoutMinutes: totalWorkoutMinutes,
    workoutGoal: goals.workoutGoal,
    water,
    waterGoal: goals.waterGoal,
    sleep,
    sleepGoal: goals.sleepGoal,
  });

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
              Today Plan.
              <br />
              Finish the mission.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Plan / v2.0
          </div>
        </nav>

        <section className="mb-5 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-100">
          {syncStatus}
        </section>

        <section className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Date Menu</p>
              <h2 className="mt-1 text-2xl font-bold">Select Date</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
              >
                โ Prev
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
                Next โ’
              </button>

              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              >
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date === today ? "Today โ€” " : ""}
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
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Mission Score</p>
            <p className="mt-3 text-7xl font-black">
              {missionScore}
              <span className="text-2xl text-zinc-500"> / 100</span>
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${missionScore}%` }}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-300">Main Priority</p>
              <p className="mt-2 text-2xl font-black">{mainPriority}</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <StatCard label="Protein" value={`${totalProtein}g`} note={`Goal ${goals.proteinGoal}g`} />
              <StatCard label="Food Calories" value={`${totalCalories}`} note={`Goal ${goals.calorieGoal} kcal`} />
              <StatCard label="Workout Burn" value={`${totalBurn}`} note="Estimated kcal" />
              <StatCard label="Net Calories" value={`${netCalories}`} note="Food - Workout" />
              <StatCard label="Water" value={`${water}L`} note={`Goal ${goals.waterGoal}L`} />
              <StatCard label="Sleep" value={`${sleep}h`} note={`Goal ${goals.sleepGoal}h`} />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Checklist</p>
            <h2 className="mt-1 text-2xl font-bold">
              {formatDateForMenu(selectedDate)}
            </h2>

            <div className="mt-5 grid gap-3">
              {missionList.map((mission) => (
                <a
                  key={mission.title}
                  href={mission.href}
                  className={
                    mission.done
                      ? "rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 hover:bg-emerald-400/15"
                      : "rounded-3xl border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black">{mission.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{mission.detail}</p>
                    </div>

                    <div
                      className={
                        mission.done
                          ? "rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-zinc-950"
                          : "rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400"
                      }
                    >
                      {mission.done ? "DONE" : "TODO"}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Signals</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SmallSignal label="Food logs" value={String(selectedFoodLogs.length)} />
                <SmallSignal label="Workout logs" value={String(selectedWorkoutLogs.length)} />
                <SmallSignal label="Sweet drinks" value={String(sweetDrinkCount)} />
                <SmallSignal label="Junk food" value={String(junkFoodCount)} />
                <SmallSignal label="Snack level" value={dailyLog?.snackLevel ?? "-"} />
                <SmallSignal label="Mood" value={dailyLog?.mood ?? "-"} />
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
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
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function SmallSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}
