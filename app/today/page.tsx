"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";

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
  snackLevel: string;
  mood: string;
  notes: string;
};

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "other";

type FoodLog = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  protein: number;
  calories: number;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
};

type WorkoutType =
  | "badminton"
  | "home-workout"
  | "walking"
  | "running"
  | "swimming"
  | "stretching"
  | "other";

type WorkoutLog = {
  id: string;
  date: string;
  type: WorkoutType;
  durationMinutes: number;
  estimatedCalories: number;
  playType: string;
  gamesPlayed: number;
  steps: number;
  distanceKm: number;
  swimmingMeters: number;
  laps: number;
  pushupSets: number;
  pushupReps: number;
  squatSets: number;
  squatReps: number;
  plankSets: number;
  plankMinutes: number;
  notes: string;
};

const storageKeys = {
  goals: "operation-recode-goals",
  daily: "operation-recode-logs-no-waist",
  food: "operation-recode-food-logs",
  workout: "operation-recode-workout-logs",
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

function normalizeDaily(raw: Record<string, unknown>): DailyLog {
  return {
    date: typeof raw.date === "string" ? raw.date : today,
    weight: toNumber(raw.weight ?? raw.weightKg, 0),
    sleep: toNumber(raw.sleep ?? raw.sleepHours, 0),
    water: toNumber(raw.water ?? raw.waterLiters, 0),
    snackLevel: typeof raw.snackLevel === "string" ? raw.snackLevel : "none",
    mood: typeof raw.mood === "string" ? raw.mood : "neutral",
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function databaseToDaily(row: Record<string, unknown>): DailyLog {
  return {
    date: typeof row.date === "string" ? row.date : today,
    weight: toNumber(row.weight, 0),
    sleep: toNumber(row.sleep, 0),
    water: toNumber(row.water, 0),
    snackLevel: typeof row.snack_level === "string" ? row.snack_level : "none",
    mood: typeof row.mood === "string" ? row.mood : "neutral",
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function dailyToDatabase(log: DailyLog, userId: string) {
  return {
    user_id: userId,
    date: log.date,
    weight: log.weight,
    sleep: log.sleep,
    water: log.water,
    snack_level: log.snackLevel,
    mood: log.mood,
    notes: log.notes,
    updated_at: new Date().toISOString(),
  };
}

function normalizeMealType(value: unknown): MealType {
  if (
    value === "breakfast" ||
    value === "lunch" ||
    value === "dinner" ||
    value === "snack" ||
    value === "drink" ||
    value === "other"
  ) {
    return value;
  }

  return "other";
}

function normalizeFood(raw: Record<string, unknown>): FoodLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    mealType: normalizeMealType(raw.mealType ?? raw.meal_type),
    foodName:
      typeof raw.foodName === "string"
        ? raw.foodName
        : typeof raw.food_name === "string"
        ? raw.food_name
        : typeof raw.name === "string"
        ? raw.name
        : "",
    protein: toNumber(raw.protein ?? raw.proteinGrams, 0),
    calories: toNumber(raw.calories ?? raw.kcal, 0),
    sweetDrink: raw.sweetDrink === true || raw.sweet_drink === true,
    junkFood: raw.junkFood === true || raw.junk_food === true,
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function databaseToFood(row: Record<string, unknown>): FoodLog {
  return {
    id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
    date: typeof row.date === "string" ? row.date : today,
    mealType: normalizeMealType(row.meal_type),
    foodName: typeof row.food_name === "string" ? row.food_name : "",
    protein: toNumber(row.protein, 0),
    calories: toNumber(row.calories, 0),
    sweetDrink: row.sweet_drink === true,
    junkFood: row.junk_food === true,
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function foodToDatabase(log: FoodLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    meal_type: log.mealType,
    food_name: log.foodName,
    protein: log.protein,
    calories: Math.round(log.calories),
    sweet_drink: log.sweetDrink,
    junk_food: log.junkFood,
    notes: log.notes,
    updated_at: new Date().toISOString(),
  };
}

function normalizeWorkoutType(value: unknown): WorkoutType {
  if (
    value === "badminton" ||
    value === "home-workout" ||
    value === "walking" ||
    value === "running" ||
    value === "swimming" ||
    value === "stretching" ||
    value === "other"
  ) {
    return value;
  }

  return "other";
}

function normalizeWorkout(raw: Record<string, unknown>): WorkoutLog {
  const details =
    raw.details && typeof raw.details === "object"
      ? (raw.details as Record<string, unknown>)
      : raw;

  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    type: normalizeWorkoutType(raw.type),
    durationMinutes: toNumber(raw.durationMinutes ?? raw.duration_minutes, 0),
    estimatedCalories: toNumber(
      raw.estimatedCalories ?? raw.estimated_calories,
      0
    ),
    playType: typeof details.playType === "string" ? details.playType : "casual",
    gamesPlayed: toNumber(details.gamesPlayed, 0),
    steps: toNumber(details.steps, 0),
    distanceKm: toNumber(details.distanceKm, 0),
    swimmingMeters: toNumber(details.swimmingMeters, 0),
    laps: toNumber(details.laps, 0),
    pushupSets: toNumber(details.pushupSets, 3),
    pushupReps: toNumber(details.pushupReps, 10),
    squatSets: toNumber(details.squatSets, 3),
    squatReps: toNumber(details.squatReps, 15),
    plankSets: toNumber(details.plankSets, 3),
    plankMinutes: toNumber(details.plankMinutes, 0.5),
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function databaseToWorkout(row: Record<string, unknown>): WorkoutLog {
  return normalizeWorkout({
    id: row.id,
    date: row.date,
    type: row.type,
    duration_minutes: row.duration_minutes,
    estimated_calories: row.estimated_calories,
    details: row.details,
    notes: row.notes,
  });
}

function workoutToDatabase(log: WorkoutLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    type: log.type,
    duration_minutes: Math.round(log.durationMinutes),
    estimated_calories: Math.round(log.estimatedCalories),
    details: {
      playType: log.playType,
      gamesPlayed: log.gamesPlayed,
      steps: log.steps,
      distanceKm: log.distanceKm,
      swimmingMeters: log.swimmingMeters,
      laps: log.laps,
      pushupSets: log.pushupSets,
      pushupReps: log.pushupReps,
      squatSets: log.squatSets,
      squatReps: log.squatReps,
      plankSets: log.plankSets,
      plankMinutes: log.plankMinutes,
    },
    notes: log.notes,
    updated_at: new Date().toISOString(),
  };
}

function getMET(type: WorkoutType) {
  if (type === "badminton") return 5.5;
  if (type === "walking") return 3.5;
  if (type === "running") return 8;
  if (type === "swimming") return 7;
  if (type === "home-workout") return 4;
  if (type === "stretching") return 2.5;
  return 3;
}

function estimateCalories({
  type,
  weightKg,
  minutes,
}: {
  type: WorkoutType;
  weightKg: number;
  minutes: number;
}) {
  const met = getMET(type);
  const calories = (met * 3.5 * weightKg * minutes) / 200;

  return Math.max(Math.round(calories), 0);
}

function getPercent(value: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(Math.round((value / goal) * 100), 100);
}

function getStatusText(score: number) {
  if (score >= 85) return "Locked in.";
  if (score >= 65) return "Good pace.";
  if (score >= 45) return "Still recoverable.";
  return "Start small now.";
}

function getCoachLine({
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
  if (sleep > 0 && sleep < sleepGoal - 1) {
    return "Sleep is low. Keep today simple and clean.";
  }

  if (water < waterGoal) {
    return "Drink water first. Do not confuse thirst with hunger.";
  }

  if (protein < proteinGoal * 0.65) {
    return "Protein is your main mission now.";
  }

  if (calories > calorieGoal) {
    return "Calories are over. Make the next meal clean.";
  }

  if (workoutMinutes < workoutGoal) {
    return "Movement is still missing. A short walk counts.";
  }

  return "Good day. Protect the pattern.";
}

function createDailyForm(log?: DailyLog): DailyLog {
  return {
    date: today,
    weight: log?.weight ?? 0,
    sleep: log?.sleep ?? 0,
    water: log?.water ?? 0,
    snackLevel: log?.snackLevel ?? "none",
    mood: log?.mood ?? "neutral",
    notes: log?.notes ?? "",
  };
}

function getCurrentWeight(dailyLogs: DailyLog[]) {
  const todayWeight = dailyLogs.find((log) => log.date === today && log.weight > 0);
  if (todayWeight) return todayWeight.weight;

  const latest = dailyLogs
    .filter((log) => log.weight > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return latest?.weight ?? 70;
}

function getWorkoutLabel(type: WorkoutType) {
  if (type === "badminton") return "Badminton";
  if (type === "home-workout") return "Home";
  if (type === "walking") return "Walk";
  if (type === "running") return "Run";
  if (type === "swimming") return "Swim";
  if (type === "stretching") return "Stretch";
  return "Other";
}

export default function TodayPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [dailyForm, setDailyForm] = useState<DailyLog>(() => createDailyForm());
  const [userId, setUserId] = useState("");
  const [syncStatus, setSyncStatus] = useState("Loading today...");

  useEffect(() => {
    async function loadToday() {
      const localGoals = loadLocalGoals();

      const localDaily = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.daily)
      ).map((item) => normalizeDaily(item));

      const localFood = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.food)
      ).map((item) => normalizeFood(item));

      const localWorkout = safeParseArray<Record<string, unknown>>(
        localStorage.getItem(storageKeys.workout)
      ).map((item) => normalizeWorkout(item));

      setGoals(localGoals);
      setDailyLogs(localDaily);
      setFoodLogs(localFood);
      setWorkoutLogs(localWorkout);

      const localTodayDaily = localDaily.find((log) => log.date === today);
      setDailyForm(createDailyForm(localTodayDaily));

      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setSyncStatus("Local mode");
          return;
        }

        setUserId(userData.user.id);

        const [goalsResult, dailyResult, foodResult, workoutResult] =
          await Promise.all([
            supabase
              .from("goals")
              .select("*")
              .eq("user_id", userData.user.id)
              .maybeSingle(),
            supabase.from("daily_logs").select("*").eq("user_id", userData.user.id),
            supabase.from("food_logs").select("*").eq("user_id", userData.user.id),
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

        if (!dailyResult.error && dailyResult.data) {
          const cloudDaily = dailyResult.data.map((item) =>
            databaseToDaily(item as Record<string, unknown>)
          );

          setDailyLogs(cloudDaily);
          localStorage.setItem(storageKeys.daily, JSON.stringify(cloudDaily));

          const cloudTodayDaily = cloudDaily.find((log) => log.date === today);
          setDailyForm(createDailyForm(cloudTodayDaily));
        }

        if (!foodResult.error && foodResult.data) {
          const cloudFood = foodResult.data.map((item) =>
            databaseToFood(item as Record<string, unknown>)
          );
          setFoodLogs(cloudFood);
          localStorage.setItem(storageKeys.food, JSON.stringify(cloudFood));
        }

        if (!workoutResult.error && workoutResult.data) {
          const cloudWorkout = workoutResult.data.map((item) =>
            databaseToWorkout(item as Record<string, unknown>)
          );
          setWorkoutLogs(cloudWorkout);
          localStorage.setItem(storageKeys.workout, JSON.stringify(cloudWorkout));
        }

        setSyncStatus("Synced");
      } catch {
        setSyncStatus("Local fallback");
      }
    }

    loadToday();
  }, []);

  const todayDaily = dailyLogs.find((log) => log.date === today);
  const todayFood = foodLogs.filter((log) => log.date === today);
  const todayWorkout = workoutLogs.filter((log) => log.date === today);

  const protein = todayFood.reduce((sum, log) => sum + log.protein, 0);
  const calories = todayFood.reduce((sum, log) => sum + log.calories, 0);
  const burn = todayWorkout.reduce((sum, log) => sum + log.estimatedCalories, 0);
  const workoutMinutes = todayWorkout.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );
  const netCalories = calories - burn;

  const water = todayDaily?.water ?? 0;
  const sleep = todayDaily?.sleep ?? 0;
  const currentWeight = getCurrentWeight(dailyLogs);

  const score = useMemo(() => {
    const dailyScore = todayDaily ? 20 : 0;
    const proteinScore = getPercent(protein, goals.proteinGoal) * 0.25;
    const calorieScore =
      calories > 0 && netCalories <= goals.calorieGoal
        ? 25
        : calories > 0
        ? 10
        : 0;
    const workoutScore = getPercent(workoutMinutes, goals.workoutGoal) * 0.15;
    const waterScore = getPercent(water, goals.waterGoal) * 0.1;
    const sleepScore = getPercent(sleep, goals.sleepGoal) * 0.05;

    return Math.round(
      dailyScore +
        proteinScore +
        calorieScore +
        workoutScore +
        waterScore +
        sleepScore
    );
  }, [todayDaily, protein, calories, netCalories, workoutMinutes, water, sleep, goals]);

  const coachLine = getCoachLine({
    protein,
    proteinGoal: goals.proteinGoal,
    calories,
    calorieGoal: goals.calorieGoal,
    workoutMinutes,
    workoutGoal: goals.workoutGoal,
    water,
    waterGoal: goals.waterGoal,
    sleep,
    sleepGoal: goals.sleepGoal,
  });

  async function saveDailyForm(formToSave: DailyLog, label = "Daily check-in") {
    const savedDaily: DailyLog = {
      date: today,
      weight: Number(formToSave.weight),
      sleep: Number(formToSave.sleep),
      water: Number(formToSave.water),
      snackLevel: formToSave.snackLevel,
      mood: formToSave.mood,
      notes: formToSave.notes.trim(),
    };

    const nextDailyLogs = dailyLogs.some((log) => log.date === today)
      ? dailyLogs.map((log) => (log.date === today ? savedDaily : log))
      : [...dailyLogs, savedDaily];

    setDailyLogs(nextDailyLogs);
    setDailyForm(savedDaily);
    localStorage.setItem(storageKeys.daily, JSON.stringify(nextDailyLogs));

    if (!userId) {
      setSyncStatus(`${label} saved locally`);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("daily_logs")
        .upsert(dailyToDatabase(savedDaily, userId), {
          onConflict: "user_id,date",
        });

      if (error) {
        setSyncStatus(`${label} saved locally, cloud sync failed: ${error.message}`);
        return;
      }

      setSyncStatus(`${label} saved + synced`);
    } catch {
      setSyncStatus(`${label} saved locally`);
    }
  }

  async function quickAddWater(amount: number) {
    const nextForm = {
      ...dailyForm,
      water: Number((Number(dailyForm.water) + amount).toFixed(2)),
    };

    setDailyForm(nextForm);
    await saveDailyForm(nextForm, `Water +${amount}L`);
  }

  async function quickAddFood({
    foodName,
    proteinValue,
    caloriesValue,
    mealType,
  }: {
    foodName: string;
    proteinValue: number;
    caloriesValue: number;
    mealType: MealType;
  }) {
    const newLog: FoodLog = {
      id: crypto.randomUUID(),
      date: today,
      mealType,
      foodName,
      protein: proteinValue,
      calories: caloriesValue,
      sweetDrink: false,
      junkFood: false,
      notes: "Quick add from Today",
    };

    const nextLogs = [...foodLogs, newLog];

    setFoodLogs(nextLogs);
    localStorage.setItem(storageKeys.food, JSON.stringify(nextLogs));

    if (!userId) {
      setSyncStatus(`Added ${foodName} locally`);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("food_logs")
        .upsert(foodToDatabase(newLog, userId), { onConflict: "id" });

      if (error) {
        setSyncStatus(`Added locally, cloud sync failed: ${error.message}`);
        return;
      }

      setSyncStatus(`Added ${foodName} + synced`);
    } catch {
      setSyncStatus(`Added ${foodName} locally`);
    }
  }

  async function quickAddWorkout({
    type,
    minutes,
    label,
  }: {
    type: WorkoutType;
    minutes: number;
    label: string;
  }) {
    const estimatedCalories = estimateCalories({
      type,
      weightKg: currentWeight,
      minutes,
    });

    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      date: today,
      type,
      durationMinutes: minutes,
      estimatedCalories,
      playType: "casual",
      gamesPlayed: 0,
      steps: 0,
      distanceKm: 0,
      swimmingMeters: 0,
      laps: 0,
      pushupSets: 3,
      pushupReps: 10,
      squatSets: 3,
      squatReps: 15,
      plankSets: 3,
      plankMinutes: 0.5,
      notes: "Quick add from Today",
    };

    const nextLogs = [...workoutLogs, newLog];

    setWorkoutLogs(nextLogs);
    localStorage.setItem(storageKeys.workout, JSON.stringify(nextLogs));

    if (!userId) {
      setSyncStatus(`Added ${label} locally`);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("workout_logs")
        .upsert(workoutToDatabase(newLog, userId), { onConflict: "id" });

      if (error) {
        setSyncStatus(`Added locally, cloud sync failed: ${error.message}`);
        return;
      }

      setSyncStatus(`Added ${label} + synced`);
    } catch {
      setSyncStatus(`Added ${label} locally`);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <section className="recode-shell mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="recode-kicker">Operation: Recode</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
              Today
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Your daily command center for check-in, food, workout, and recovery.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300">
            {today} · {syncStatus}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
          <aside className="space-y-4 xl:sticky xl:top-28">
            <section className="recode-card-strong rounded-[2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-bold text-emerald-200">System Score</p>
                  <p className="mt-3 text-7xl font-black tracking-tighter md:text-8xl">
                    {score}
                  </p>
                  <p className="mt-1 text-xl font-black text-zinc-200">
                    {getStatusText(score)}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-zinc-950">
                  LIVE
                </div>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-300">{coachLine}</p>
            </section>

            <section className="recode-card rounded-[2rem] p-5">
              <p className="text-sm font-bold text-zinc-500">Today Metrics</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricCard
                  label="Protein"
                  value={`${protein}g`}
                  goal={`${goals.proteinGoal}g`}
                  percent={getPercent(protein, goals.proteinGoal)}
                  href="/food"
                />

                <MetricCard
                  label="Calories"
                  value={`${calories}`}
                  goal={`${goals.calorieGoal}`}
                  percent={getPercent(calories, goals.calorieGoal)}
                  href="/food"
                />

                <MetricCard
                  label="Burn"
                  value={`${burn}`}
                  goal="kcal"
                  percent={getPercent(burn, 500)}
                  href="/workout"
                />

                <MetricCard
                  label="Net"
                  value={`${netCalories}`}
                  goal="food - burn"
                  percent={getPercent(Math.max(netCalories, 0), goals.calorieGoal)}
                  href="/coach"
                />

                <MetricCard
                  label="Workout"
                  value={`${workoutMinutes}m`}
                  goal={`${goals.workoutGoal}m`}
                  percent={getPercent(workoutMinutes, goals.workoutGoal)}
                  href="/workout"
                />

                <MetricCard
                  label="Water"
                  value={`${water}L`}
                  goal={`${goals.waterGoal}L`}
                  percent={getPercent(water, goals.waterGoal)}
                  href="/today"
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <QuickAction
                href="/food"
                title="Food"
                description="Full log and edit"
              />

              <QuickAction
                href="/workout"
                title="Workout"
                description="Movement details"
              />

              <QuickAction
                href="/coach"
                title="Coach"
                description="What to fix next"
              />
            </section>
          </aside>

          <section className="space-y-4">
            <section className="recode-card rounded-[2rem] p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-bold text-zinc-500">Daily Check-in</p>
                  <h2 className="mt-1 text-2xl font-black">Baseline today</h2>
                </div>

                <button
                  onClick={() => saveDailyForm(dailyForm)}
                  className="recode-button-primary"
                >
                  Save Check-in
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Input
                  label="Weight kg"
                  type="number"
                  step="0.1"
                  value={String(dailyForm.weight)}
                  onChange={(value) =>
                    setDailyForm({ ...dailyForm, weight: Number(value) })
                  }
                />

                <Input
                  label="Sleep hours"
                  type="number"
                  step="0.5"
                  value={String(dailyForm.sleep)}
                  onChange={(value) =>
                    setDailyForm({ ...dailyForm, sleep: Number(value) })
                  }
                />

                <Input
                  label="Water liters"
                  type="number"
                  step="0.25"
                  value={String(dailyForm.water)}
                  onChange={(value) =>
                    setDailyForm({ ...dailyForm, water: Number(value) })
                  }
                />

                <label className="block">
                  <span className="recode-label">Mood</span>
                  <select
                    value={dailyForm.mood}
                    onChange={(event) =>
                      setDailyForm({ ...dailyForm, mood: event.target.value })
                    }
                    className="recode-input"
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="tired">Tired</option>
                    <option value="bad">Bad</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[0.65fr_1.35fr]">
                <label className="block">
                  <span className="recode-label">Snack Level</span>
                  <select
                    value={dailyForm.snackLevel}
                    onChange={(event) =>
                      setDailyForm({
                        ...dailyForm,
                        snackLevel: event.target.value,
                      })
                    }
                    className="recode-input"
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="block">
                  <span className="recode-label">Notes</span>
                  <input
                    value={dailyForm.notes}
                    onChange={(event) =>
                      setDailyForm({ ...dailyForm, notes: event.target.value })
                    }
                    placeholder="Energy, hunger, knee, mood, or anything important"
                    className="recode-input"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:flex">
                <button
                  onClick={() => quickAddWater(0.25)}
                  className="recode-button-ghost"
                >
                  +0.25L Water
                </button>

                <button
                  onClick={() => quickAddWater(0.5)}
                  className="recode-button-ghost"
                >
                  +0.5L Water
                </button>
              </div>
            </section>

            <section className="recode-card rounded-[2rem] p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-bold text-zinc-500">Quick Add</p>
                  <h2 className="mt-1 text-2xl font-black">Log fast</h2>
                </div>

                <p className="text-sm text-zinc-500">
                  One tap actions for repeat meals and workouts.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <QuickButton
                  label="+ Whey"
                  sub="25g · 120 kcal"
                  onClick={() =>
                    quickAddFood({
                      foodName: "Whey 1 scoop",
                      proteinValue: 25,
                      caloriesValue: 120,
                      mealType: "drink",
                    })
                  }
                />

                <QuickButton
                  label="+ Eggs"
                  sub="12g · 140 kcal"
                  onClick={() =>
                    quickAddFood({
                      foodName: "Eggs 2 pcs",
                      proteinValue: 12,
                      caloriesValue: 140,
                      mealType: "breakfast",
                    })
                  }
                />

                <QuickButton
                  label="+ Chicken"
                  sub="35g · 180 kcal"
                  onClick={() =>
                    quickAddFood({
                      foodName: "Chicken breast",
                      proteinValue: 35,
                      caloriesValue: 180,
                      mealType: "lunch",
                    })
                  }
                />

                <QuickButton
                  label="+ Milk"
                  sub="8g · 130 kcal"
                  onClick={() =>
                    quickAddFood({
                      foodName: "Milk",
                      proteinValue: 8,
                      caloriesValue: 130,
                      mealType: "drink",
                    })
                  }
                />

                <QuickButton
                  label="+ Badminton"
                  sub="120 min"
                  onClick={() =>
                    quickAddWorkout({
                      type: "badminton",
                      minutes: 120,
                      label: "Badminton 120 min",
                    })
                  }
                />

                <QuickButton
                  label="+ Walk"
                  sub="30 min"
                  onClick={() =>
                    quickAddWorkout({
                      type: "walking",
                      minutes: 30,
                      label: "Walk 30 min",
                    })
                  }
                />

                <QuickButton
                  label="+ Home"
                  sub="15 min"
                  onClick={() =>
                    quickAddWorkout({
                      type: "home-workout",
                      minutes: 15,
                      label: "Home Workout 15 min",
                    })
                  }
                />

                <QuickButton
                  label="+ Stretch"
                  sub="15 min"
                  onClick={() =>
                    quickAddWorkout({
                      type: "stretching",
                      minutes: 15,
                      label: "Stretch 15 min",
                    })
                  }
                />
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <section className="recode-card rounded-[2rem] p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-500">Food Log</p>
                    <h2 className="mt-1 text-2xl font-black">Today food</h2>
                  </div>

                  <Link href="/food" className="text-sm font-black text-emerald-300">
                    Edit →
                  </Link>
                </div>

                <div className="mt-5 grid gap-3">
                  {todayFood.length === 0 ? (
                    <EmptyState text="No food logged yet." />
                  ) : (
                    todayFood
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((item) => (
                        <LogRow
                          key={item.id}
                          title={item.foodName}
                          detail={`${item.protein}g protein · ${item.calories} kcal`}
                        />
                      ))
                  )}
                </div>
              </section>

              <section className="recode-card rounded-[2rem] p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-500">Workout Log</p>
                    <h2 className="mt-1 text-2xl font-black">Today movement</h2>
                  </div>

                  <Link
                    href="/workout"
                    className="text-sm font-black text-emerald-300"
                  >
                    Edit →
                  </Link>
                </div>

                <div className="mt-5 grid gap-3">
                  {todayWorkout.length === 0 ? (
                    <EmptyState text="No workout logged yet." />
                  ) : (
                    todayWorkout
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((item) => (
                        <LogRow
                          key={item.id}
                          title={getWorkoutLabel(item.type)}
                          detail={`${item.durationMinutes} min · ${item.estimatedCalories} kcal`}
                        />
                      ))
                  )}
                </div>
              </section>
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  goal,
  percent,
  href,
}: {
  label: string;
  value: string;
  goal: string;
  percent: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/5 bg-black/20 p-3 hover:bg-white/[0.04]"
    >
      <p className="text-xs font-bold text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{goal}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  );
}

function QuickButton({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/5 bg-black/20 p-3.5 text-left hover:bg-white/[0.05]"
    >
      <p className="text-sm font-black text-white">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </button>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="recode-card rounded-3xl p-5 hover:bg-white/[0.04]">
      <p className="text-xl font-black">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </Link>
  );
}

function Input({
  label,
  type,
  value,
  onChange,
  step,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="recode-label">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="recode-input"
      />
    </label>
  );
}

function LogRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm font-bold text-zinc-500">
      {text}
    </div>
  );
}
