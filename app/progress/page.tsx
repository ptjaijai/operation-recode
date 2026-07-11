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

type WeekDay = {
  date: string;
  weight: number;
  sleep: number;
  water: number;
  protein: number;
  calories: number;
  burn: number;
  netCalories: number;
  workoutMinutes: number;
  sweetDrinkCount: number;
  junkFoodCount: number;
  score: number;
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

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
  });
}

function shiftDate(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  return getLocalDateString(date);
}

function getWeekDates(endDateString: string) {
  const dates: string[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    dates.push(shiftDate(endDateString, -index));
  }

  return dates;
}

function getProteinScore(protein: number, goal: number) {
  if (protein >= goal) return 100;
  if (protein >= goal * 0.85) return 85;
  if (protein >= goal * 0.65) return 65;
  if (protein >= goal * 0.5) return 45;
  if (protein > 0) return 25;
  return 0;
}

function getCalorieScore(netCalories: number, calorieGoal: number) {
  if (netCalories === 0) return 0;

  const diff = Math.abs(netCalories - calorieGoal);
  const diffPercent = diff / calorieGoal;

  if (netCalories <= calorieGoal && diffPercent <= 0.1) return 100;
  if (netCalories <= calorieGoal && diffPercent <= 0.25) return 85;
  if (netCalories <= calorieGoal) return 70;
  if (diffPercent <= 0.1) return 70;
  if (diffPercent <= 0.25) return 45;
  return 20;
}

function getWorkoutScore(minutes: number, goal: number) {
  if (minutes >= goal) return 100;
  if (minutes >= goal * 0.75) return 75;
  if (minutes >= goal * 0.5) return 50;
  if (minutes > 0) return 30;
  return 0;
}

function getWaterScore(water: number, goal: number) {
  if (water >= goal) return 100;
  if (water >= goal * 0.8) return 80;
  if (water >= goal * 0.6) return 60;
  if (water > 0) return 30;
  return 0;
}

function getSleepScore(sleep: number, goal: number) {
  if (sleep >= goal) return 100;
  if (sleep >= goal - 1) return 75;
  if (sleep >= goal - 2) return 45;
  if (sleep > 0) return 25;
  return 0;
}

function getFoodQualityScore(sweetDrinkCount: number, junkFoodCount: number) {
  const penalty = sweetDrinkCount * 20 + junkFoodCount * 25;
  return Math.max(100 - penalty, 0);
}

function getDayScore(day: WeekDay, goals: Goals) {
  return Math.round(
    getProteinScore(day.protein, goals.proteinGoal) * 0.25 +
      getCalorieScore(day.netCalories, goals.calorieGoal) * 0.25 +
      getWorkoutScore(day.workoutMinutes, goals.workoutGoal) * 0.15 +
      getWaterScore(day.water, goals.waterGoal) * 0.15 +
      getSleepScore(day.sleep, goals.sleepGoal) * 0.15 +
      getFoodQualityScore(day.sweetDrinkCount, day.junkFoodCount) * 0.05
  );
}

function getWeekComment({
  avgScore,
  weightChange,
  avgNetCalories,
  calorieGoal,
  proteinHitDays,
}: {
  avgScore: number;
  weightChange: number;
  avgNetCalories: number;
  calorieGoal: number;
  proteinHitDays: number;
}) {
  if (avgScore >= 80 && weightChange < 0) {
    return "เธญเธฒเธ—เธดเธ•เธขเนเธเธตเนเธฃเธฐเธเธเธ”เธตเธกเธฒเธ เธเนเธณเธซเธเธฑเธเธฅเธเนเธฅเธฐเธเธฐเนเธเธเธฃเธงเธกเธชเธนเธ เธ—เธณ pattern เธเธตเนเธ•เนเธญเนเธ”เนเน€เธฅเธข";
  }

  if (avgNetCalories > calorieGoal) {
    return "เธเธฑเธเธซเธฒเธซเธฅเธฑเธเธเธญเธเธชเธฑเธเธ”เธฒเธซเนเธเธตเนเธเธทเธญ net calories เธชเธนเธเน€เธเธดเธเน€เธเนเธฒ เธเธงเธฃเธฅเธ” snack/เธเนเธณเธซเธงเธฒเธเธเนเธญเธเน€เธเธดเนเธก workout";
  }

  if (proteinHitDays < 3) {
    return "เนเธเธฃเธ•เธตเธเธขเธฑเธเนเธกเนเธชเธกเนเธณเน€เธชเธกเธญ เธ–เนเธฒเธเธฐเธฅเธ”เธเนเธณเธซเธเธฑเธเนเธเธเนเธกเนเนเธ—เธฃเธก เนเธซเนเธฅเนเธญเธเนเธเธฃเธ•เธตเธเธเนเธญเธ";
  }

  if (weightChange > 0.5) {
    return "เธเนเธณเธซเธเธฑเธเธเธถเนเธเนเธเธชเธฑเธเธ”เธฒเธซเนเธเธตเน เธญเธฒเธเธกเธฒเธเธฒเธเนเธเธฅ/เธเนเธณ/เน€เธเนเธก/เธเธญเธเธเนเธญเธข เธ”เธน trend เธญเธตเธ 7 เธงเธฑเธ เธญเธขเนเธฒ panic";
  }

  if (avgScore < 55) {
    return "เธชเธฑเธเธ”เธฒเธซเนเธเธตเนเธฃเธฐเธเธเธขเธฑเธเนเธเธงเนเธเธกเธฒเธ เนเธซเนเน€เธฃเธดเนเธกเธเธฒเธ Daily + Protein + Water เนเธกเนเธ•เนเธญเธเธ—เธณเธ—เธธเธเธญเธขเนเธฒเธเธเธฃเนเธญเธกเธเธฑเธ";
  }

  return "เธชเธฑเธเธ”เธฒเธซเนเธเธตเนเธเธฅเธฒเธ เน เธขเธฑเธเธกเธตเธเธธเธ”เนเธซเน optimize เนเธ”เธขเน€เธเธเธฒเธฐเธเธงเธฒเธกเธชเธกเนเธณเน€เธชเธกเธญเธเธญเธเธญเธฒเธซเธฒเธฃเนเธฅเธฐเธเธฒเธฃเธเธญเธ";
}

export default function ProgressPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [syncStatus, setSyncStatus] = useState("Loading progress data...");

  useEffect(() => {
    async function loadProgressData() {
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
          setSyncStatus("Not logged in. Progress is using local data only.");
          return;
        }

        setSyncStatus("Loading cloud progress data...");

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

        setSyncStatus("Progress data loaded from Supabase.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadProgressData();
  }, []);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    dates.add(today);
    dailyLogs.forEach((log) => dates.add(log.date));
    foodLogs.forEach((log) => dates.add(log.date));
    workoutLogs.forEach((log) => dates.add(log.date));

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [dailyLogs, foodLogs, workoutLogs]);

  const weekDays = useMemo(() => {
    const weekDates = getWeekDates(selectedDate);

    return weekDates.map((date) => {
      const dailyLog = dailyLogs.find((log) => log.date === date);
      const food = foodLogs.filter((log) => log.date === date);
      const workout = workoutLogs.filter((log) => log.date === date);

      const protein = food.reduce((sum, log) => sum + log.protein, 0);
      const calories = food.reduce((sum, log) => sum + log.calories, 0);
      const burn = workout.reduce((sum, log) => sum + log.estimatedCalories, 0);
      const workoutMinutes = workout.reduce(
        (sum, log) => sum + log.durationMinutes,
        0
      );
      const sweetDrinkCount = food.filter((log) => log.sweetDrink).length;
      const junkFoodCount = food.filter((log) => log.junkFood).length;

      const day: WeekDay = {
        date,
        weight: dailyLog?.weight ?? 0,
        sleep: dailyLog?.sleep ?? 0,
        water: dailyLog?.water ?? 0,
        protein,
        calories,
        burn,
        netCalories: calories - burn,
        workoutMinutes,
        sweetDrinkCount,
        junkFoodCount,
        score: 0,
      };

      return {
        ...day,
        score: getDayScore(day, goals),
      };
    });
  }, [dailyLogs, foodLogs, workoutLogs, selectedDate, goals]);

  const weightLogs = dailyLogs
    .filter((log) => log.weight > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestWeight = weightLogs[weightLogs.length - 1]?.weight ?? 0;
  const firstWeight = weightLogs[0]?.weight ?? 0;
  const overallWeightChange =
    latestWeight && firstWeight ? latestWeight - firstWeight : 0;
  const weightLeft = latestWeight ? Math.max(latestWeight - goals.targetWeight, 0) : 0;

  const weekWeightLogs = weekDays.filter((day) => day.weight > 0);
  const weekStartWeight = weekWeightLogs[0]?.weight ?? 0;
  const weekEndWeight = weekWeightLogs[weekWeightLogs.length - 1]?.weight ?? 0;
  const weeklyWeightChange =
    weekStartWeight && weekEndWeight ? weekEndWeight - weekStartWeight : 0;

  const totalCalories = weekDays.reduce((sum, day) => sum + day.calories, 0);
  const totalBurn = weekDays.reduce((sum, day) => sum + day.burn, 0);
  const totalNetCalories = weekDays.reduce((sum, day) => sum + day.netCalories, 0);
  const totalProtein = weekDays.reduce((sum, day) => sum + day.protein, 0);
  const totalWorkoutMinutes = weekDays.reduce(
    (sum, day) => sum + day.workoutMinutes,
    0
  );

  const avgCalories = Math.round(totalCalories / 7);
  const avgBurn = Math.round(totalBurn / 7);
  const avgNetCalories = Math.round(totalNetCalories / 7);
  const avgProtein = Math.round(totalProtein / 7);
  const avgScore = Math.round(
    weekDays.reduce((sum, day) => sum + day.score, 0) / 7
  );

  const proteinHitDays = weekDays.filter(
    (day) => day.protein >= goals.proteinGoal
  ).length;

  const calorieHitDays = weekDays.filter(
    (day) => day.netCalories > 0 && day.netCalories <= goals.calorieGoal
  ).length;

  const workoutHitDays = weekDays.filter(
    (day) => day.workoutMinutes >= goals.workoutGoal
  ).length;

  const dailyCheckinDays = weekDays.filter(
    (day) => day.weight > 0 || day.sleep > 0 || day.water > 0
  ).length;

  const bestDay = weekDays.slice().sort((a, b) => b.score - a.score)[0];

  const maxCalories = Math.max(...weekDays.map((day) => day.calories), goals.calorieGoal);
  const maxBurn = Math.max(...weekDays.map((day) => day.burn), 300);
  const maxProtein = Math.max(...weekDays.map((day) => day.protein), goals.proteinGoal);

  const weekComment = getWeekComment({
    avgScore,
    weightChange: weeklyWeightChange,
    avgNetCalories,
    calorieGoal: goals.calorieGoal,
    proteinHitDays,
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
              Progress.
              <br />
              Read the trend.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Progress / v2.0
          </div>
        </nav>

        <section className="mb-5 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-100">
          {syncStatus}
        </section>

        <section className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Week Ending</p>
              <h2 className="mt-1 text-2xl font-bold">
                {formatDateForMenu(selectedDate)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedDate(shiftDate(selectedDate, -7))}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
              >
                โ Prev Week
              </button>

              <button
                onClick={() => setSelectedDate(today)}
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
              >
                This Week
              </button>

              <button
                onClick={() => setSelectedDate(shiftDate(selectedDate, 7))}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Next Week โ’
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

        <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Weight Progress</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <BigStat
                label="Current"
                value={latestWeight ? latestWeight.toFixed(1) : "-"}
                unit="kg"
                note="latest log"
              />

              <BigStat
                label="Target"
                value={goals.targetWeight.toFixed(1)}
                unit="kg"
                note="from settings"
              />

              <BigStat
                label="To Go"
                value={latestWeight ? weightLeft.toFixed(1) : "-"}
                unit="kg"
                note="left to target"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SmallStat
                label="Overall Change"
                value={
                  latestWeight && firstWeight
                    ? `${overallWeightChange > 0 ? "+" : ""}${overallWeightChange.toFixed(
                        1
                      )} kg`
                    : "-"
                }
              />

              <SmallStat
                label="Weekly Change"
                value={
                  weekStartWeight && weekEndWeight
                    ? `${weeklyWeightChange > 0 ? "+" : ""}${weeklyWeightChange.toFixed(
                        1
                      )} kg`
                    : "-"
                }
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Weekly Review</p>
            <p className="mt-3 text-7xl font-black">
              {avgScore}
              <span className="text-2xl text-zinc-500"> / 100</span>
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${avgScore}%` }}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-300">Coach Note</p>
              <p className="mt-2 text-lg font-bold leading-7">{weekComment}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SmallStat
                label="Best Day"
                value={bestDay ? `${formatShortDate(bestDay.date)} ยท ${bestDay.score}` : "-"}
              />
              <SmallStat label="Daily Check-ins" value={`${dailyCheckinDays}/7 days`} />
            </div>
          </div>
        </section>

        <section className="mb-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Avg Calories" value={`${avgCalories}`} note={`Goal ${goals.calorieGoal}/day`} />
          <SummaryCard label="Avg Burn" value={`${avgBurn}`} note="kcal/day estimated" />
          <SummaryCard label="Avg Net Calories" value={`${avgNetCalories}`} note="food - workout" />
          <SummaryCard label="Avg Protein" value={`${avgProtein}g`} note={`Goal ${goals.proteinGoal}g/day`} />
          <SummaryCard label="Workout Minutes" value={`${totalWorkoutMinutes}`} note={`Goal ${goals.workoutGoal * 7}/week`} />
          <SummaryCard label="Protein Hit Days" value={`${proteinHitDays}/7`} note="days reached goal" />
          <SummaryCard label="Calorie Hit Days" value={`${calorieHitDays}/7`} note="net calories on target" />
          <SummaryCard label="Workout Hit Days" value={`${workoutHitDays}/7`} note="days reached goal" />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <ChartCard
            title="Calories"
            subtitle="Food calories per day"
            days={weekDays}
            valueKey="calories"
            maxValue={maxCalories}
            goal={goals.calorieGoal}
            unit="kcal"
          />

          <ChartCard
            title="Workout Burn"
            subtitle="Estimated calories burned"
            days={weekDays}
            valueKey="burn"
            maxValue={maxBurn}
            goal={0}
            unit="kcal"
          />

          <ChartCard
            title="Protein"
            subtitle="Protein grams per day"
            days={weekDays}
            valueKey="protein"
            maxValue={maxProtein}
            goal={goals.proteinGoal}
            unit="g"
          />
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Daily Breakdown</p>
          <h2 className="mt-1 text-2xl font-bold">Last 7 days</h2>

          <div className="mt-5 grid gap-3">
            {weekDays.map((day) => (
              <div
                key={day.date}
                className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr] md:items-center"
              >
                <div>
                  <p className="font-black">{formatShortDate(day.date)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Score {day.score}/100
                  </p>
                </div>

                <p>{day.weight ? `${day.weight} kg` : "no weight"}</p>
                <p>{day.protein}g protein</p>
                <p>{day.calories} kcal food</p>
                <p>{day.burn} kcal burn</p>
                <p>{day.netCalories} kcal net</p>
                <p>{day.workoutMinutes} min</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function BigStat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-3 text-5xl font-black tracking-tight">
        {value}
        <span className="ml-1 text-xl text-zinc-500">{unit}</span>
      </p>
      <p className="mt-3 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  days,
  valueKey,
  maxValue,
  goal,
  unit,
}: {
  title: string;
  subtitle: string;
  days: WeekDay[];
  valueKey: "calories" | "burn" | "protein";
  maxValue: number;
  goal: number;
  unit: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <p className="text-sm text-zinc-400">{title}</p>
      <h2 className="mt-1 text-2xl font-bold">{subtitle}</h2>

      <div className="mt-5 grid gap-3">
        {days.map((day) => {
          const value = day[valueKey];
          const percent = Math.min((value / maxValue) * 100, 100);
          const goalPercent = goal > 0 ? Math.min((goal / maxValue) * 100, 100) : 0;

          return (
            <div key={day.date}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{formatShortDate(day.date)}</span>
                <span className="font-bold text-zinc-300">
                  {value} {unit}
                </span>
              </div>

              <div className="relative h-3 overflow-hidden rounded-full bg-zinc-800">
                {goal > 0 && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-zinc-400"
                    style={{ left: `${goalPercent}%` }}
                  />
                )}

                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
