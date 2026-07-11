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

function getProteinScore(protein: number, goal: number) {
  if (protein >= goal) return 100;
  if (protein >= goal * 0.85) return 85;
  if (protein >= goal * 0.65) return 65;
  if (protein >= goal * 0.5) return 45;
  if (protein > 0) return 25;
  return 0;
}

function getCalorieScore(calories: number, calorieGoal: number) {
  if (calories === 0) return 0;

  const diff = Math.abs(calories - calorieGoal);
  const diffPercent = diff / calorieGoal;

  if (calories <= calorieGoal && diffPercent <= 0.1) return 100;
  if (calories <= calorieGoal && diffPercent <= 0.25) return 85;
  if (calories <= calorieGoal) return 70;
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

function getMainProblem({
  hasDailyLog,
  protein,
  proteinGoal,
  calories,
  calorieGoal,
  netCalories,
  workoutMinutes,
  workoutGoal,
  water,
  waterGoal,
  sleep,
  sleepGoal,
  sweetDrinkCount,
  junkFoodCount,
}: {
  hasDailyLog: boolean;
  protein: number;
  proteinGoal: number;
  calories: number;
  calorieGoal: number;
  netCalories: number;
  workoutMinutes: number;
  workoutGoal: number;
  water: number;
  waterGoal: number;
  sleep: number;
  sleepGoal: number;
  sweetDrinkCount: number;
  junkFoodCount: number;
}) {
  if (!hasDailyLog) return "เธขเธฑเธเนเธกเนเนเธ”เนเธฅเธ Daily Check-in เน€เธฅเธข เธเนเธญเธกเธนเธฅเธงเธฑเธเธเธตเนเธขเธฑเธเนเธกเนเธเธฃเธ";
  if (sleep > 0 && sleep < sleepGoal - 1) return "เธเธญเธเธเนเธญเธข เธงเธฑเธเธเธตเนเน€เธชเธตเนเธขเธเธซเธดเธงเนเธฅเธฐเธซเธฅเธธเธ”เธเนเธฒเธข";
  if (water < waterGoal) return "เธเนเธณเธขเธฑเธเนเธกเนเธ–เธถเธเน€เธเนเธฒ เธญเธฒเธเธ—เธณเนเธซเนเธเธดเธ”เธงเนเธฒเธซเธดเธงเธ—เธฑเนเธเธ—เธตเนเธเธฃเธดเธ เน เธเธฒเธ”เธเนเธณ";
  if (protein < proteinGoal * 0.65) return "เนเธเธฃเธ•เธตเธเธขเธฑเธเธ•เนเธณเน€เธเธดเธเนเธ เธ—เธณเนเธซเนเธญเธดเนเธกเธขเธฒเธเนเธฅเธฐเธเธธเธกเนเธเธฅเธขเธฒเธ";
  if (calories > calorieGoal) return "เนเธเธฅเธญเธฃเธตเธญเธฒเธซเธฒเธฃเน€เธเธดเธเน€เธเนเธฒเธงเธฑเธเธเธตเนเนเธฅเนเธง";
  if (netCalories > calorieGoal) return "Net calories เธขเธฑเธเน€เธเธดเธ เธซเธฅเธฑเธเธซเธฑเธเธญเธญเธเธเธณเธฅเธฑเธเธเธฒเธข";
  if (workoutMinutes < workoutGoal) return "Movement เธขเธฑเธเนเธกเนเธ–เธถเธเน€เธเนเธฒ";
  if (sweetDrinkCount > 0) return "เธกเธตเธเนเธณเธซเธงเธฒเธเธงเธฑเธเธเธตเน เธเธธเธ”เธเธตเนเธฅเธ”เธเนเธฒเธขเนเธฅเธฐเน€เธซเนเธเธเธฅเน€เธฃเนเธง";
  if (junkFoodCount > 0) return "เธกเธต junk food เธงเธฑเธเธเธตเน เนเธ•เนเธขเธฑเธเนเธเนเน€เธเธกเนเธ”เน";
  return "เธงเธฑเธเธเธตเนเธฃเธฐเธเธเธ”เธตเนเธฅเนเธง เน€เธซเธฅเธทเธญเนเธเนเธฃเธฑเธเธฉเธฒเนเธกเนเนเธซเนเธซเธฅเธธเธ”เธเนเธงเธเธ—เนเธฒเธขเธงเธฑเธ";
}

function getStrategy({
  protein,
  proteinGoal,
  calories,
  calorieGoal,
  netCalories,
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
  netCalories: number;
  workoutMinutes: number;
  workoutGoal: number;
  water: number;
  waterGoal: number;
  sleep: number;
  sleepGoal: number;
}) {
  if (sleep > 0 && sleep < sleepGoal - 1) {
    return "เธงเธฑเธเธเธตเนเนเธกเนเธ•เนเธญเธเน€เธฅเนเธเธซเธเธฑเธเน€เธเธดเนเธก เนเธซเนเน€เธเนเธเธเธดเธเธชเธฐเธญเธฒเธ” เธ”เธทเนเธกเธเนเธณ เนเธฅเธฐเธเธญเธเธเธทเธเธฃเธฐเธเธ";
  }

  if (water < waterGoal) {
    return `เธ”เธทเนเธกเธเนเธณเน€เธเธดเนเธกเธญเธตเธเธเธฃเธฐเธกเธฒเธ“ ${Math.max(waterGoal - water, 0).toFixed(
      1
    )}L เธเนเธญเธเธ•เธฑเธ”เธชเธดเธเนเธเธเธดเธ snack`;
  }

  if (protein < proteinGoal) {
    return `เน€เธเธดเนเธกเนเธเธฃเธ•เธตเธเธญเธตเธเธเธฃเธฐเธกเธฒเธ“ ${Math.max(
      proteinGoal - protein,
      0
    )}g เนเธ”เธขเน€เธฅเธทเธญเธเธเธญเธเธเนเธฒเธข เน€เธเนเธ เน€เธงเธขเน เนเธเน เนเธเน เธ—เธนเธเนเธฒ`;
  }

  if (calories > calorieGoal || netCalories > calorieGoal) {
    return "เธกเธทเนเธญเธ–เธฑเธ”เนเธเนเธซเนเน€เธเนเธเนเธเธฃเธ•เธตเธเธฅเธตเธ + เนเธกเนเน€เธ•เธดเธกเธเนเธณเธซเธงเธฒเธ/เธเธญเธเธ—เธญเธ” เนเธกเนเธ•เนเธญเธเธญเธ”เธญเธฒเธซเธฒเธฃ";
  }

  if (workoutMinutes < workoutGoal) {
    return `เน€เธเธดเนเธก movement เธญเธตเธ ${Math.max(
      workoutGoal - workoutMinutes,
      0
    )} เธเธฒเธ—เธต เน€เธเนเธ เน€เธ”เธดเธเธซเธฃเธทเธญเธขเธทเธ”เน€เธเธฒ เน`;
  }

  return "เธฃเธฑเธเธฉเธฒ pattern เธเธตเนเนเธงเน เธเธฃเธธเนเธเธเธตเนเน€เธเนเธเธ—เธณเธเนเธณ เนเธกเนเธ•เนเธญเธเน€เธเธดเนเธกเธเธงเธฒเธกเนเธซเธ”";
}

function getAvoidList({
  calories,
  calorieGoal,
  sweetDrinkCount,
  junkFoodCount,
  sleep,
  sleepGoal,
}: {
  calories: number;
  calorieGoal: number;
  sweetDrinkCount: number;
  junkFoodCount: number;
  sleep: number;
  sleepGoal: number;
}) {
  const avoid = [];

  if (calories >= calorieGoal * 0.85) avoid.push("เธญเธขเนเธฒเน€เธเธดเนเธก snack เนเธเธเนเธกเนเธเธณเน€เธเนเธ");
  if (sweetDrinkCount > 0) avoid.push("เน€เธฅเธตเนเธขเธเธเนเธณเธซเธงเธฒเธเนเธเนเธงเธ—เธตเนเธชเธญเธ");
  if (junkFoodCount > 0) avoid.push("เน€เธฅเธตเนเธขเธเธเธญเธเธ—เธญเธ”/เธเธเธกเน€เธเธดเนเธก");
  if (sleep > 0 && sleep < sleepGoal) avoid.push("เธญเธขเนเธฒเธเธญเธเธ”เธถเธเธเนเธณ");
  if (avoid.length === 0) avoid.push("เธญเธขเนเธฒเธเธฃเธฐเธกเธฒเธ—เธเนเธงเธเน€เธขเนเธ เน€เธเธฃเธฒเธฐเน€เธเนเธเธเนเธงเธเธซเธฅเธธเธ”เธเนเธฒเธข");

  return avoid;
}

function getTomorrowAdjustment({
  netCalories,
  calorieGoal,
  protein,
  proteinGoal,
  workoutMinutes,
  workoutGoal,
}: {
  netCalories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  workoutMinutes: number;
  workoutGoal: number;
}) {
  if (netCalories > calorieGoal) {
    return "เธเธฃเธธเนเธเธเธตเนเน€เธฃเธดเนเธกเธ”เนเธงเธขเธกเธทเนเธญเนเธเธฃเธ•เธตเธเธชเธนเธเธเนเธญเธ เธญเธขเนเธฒเนเธเนเธ”เนเธงเธขเธเธฒเธฃเธญเธ”เธ—เธฑเนเธเธงเธฑเธ";
  }

  if (protein < proteinGoal * 0.75) {
    return "เธเธฃเธธเนเธเธเธตเนเธงเธฒเธเนเธเธฃเธ•เธตเธเนเธงเนเธ•เธฑเนเธเนเธ•เนเธกเธทเนเธญเนเธฃเธ เนเธกเนเธฃเธญเนเธเนเธ•เธญเธเธเธฅเธฒเธเธเธทเธ";
  }

  if (workoutMinutes < workoutGoal) {
    return "เธเธฃเธธเนเธเธเธตเนเธฅเนเธญเธเน€เธงเธฅเธฒเน€เธ”เธดเธเธซเธฃเธทเธญ workout เธชเธฑเนเธ เน เนเธงเนเธเนเธญเธเน€เธฅเธข";
  }

  return "เธเธฃเธธเนเธเธเธตเนเธ—เธณเน€เธซเธกเธทเธญเธเน€เธ”เธดเธกเนเธ”เน เนเธ•เนเน€เธเธดเนเธกเธเธงเธฒเธกเนเธกเนเธเน€เธฃเธทเนเธญเธเนเธเธฅเธญเธฃเธตเนเธซเนเธกเธฒเธเธเธถเนเธ";
}

export default function CoachPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [syncStatus, setSyncStatus] = useState("Loading coach data...");

  useEffect(() => {
    async function loadCoachData() {
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
          setSyncStatus("Not logged in. Coach is using local data only.");
          return;
        }

        setSyncStatus("Loading cloud coach data...");

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

        setSyncStatus("Coach data loaded from Supabase.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadCoachData();
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

  const water = dailyLog?.water ?? 0;
  const sleep = dailyLog?.sleep ?? 0;

  const proteinScore = getProteinScore(totalProtein, goals.proteinGoal);
  const calorieScore = getCalorieScore(netCalories, goals.calorieGoal);
  const workoutScore = getWorkoutScore(totalWorkoutMinutes, goals.workoutGoal);
  const waterScore = getWaterScore(water, goals.waterGoal);
  const sleepScore = getSleepScore(sleep, goals.sleepGoal);
  const foodQualityScore = getFoodQualityScore(sweetDrinkCount, junkFoodCount);

  const systemScore = Math.round(
    proteinScore * 0.25 +
      calorieScore * 0.25 +
      workoutScore * 0.15 +
      waterScore * 0.15 +
      sleepScore * 0.15 +
      foodQualityScore * 0.05
  );

  const mainProblem = getMainProblem({
    hasDailyLog: Boolean(dailyLog),
    protein: totalProtein,
    proteinGoal: goals.proteinGoal,
    calories: totalCalories,
    calorieGoal: goals.calorieGoal,
    netCalories,
    workoutMinutes: totalWorkoutMinutes,
    workoutGoal: goals.workoutGoal,
    water,
    waterGoal: goals.waterGoal,
    sleep,
    sleepGoal: goals.sleepGoal,
    sweetDrinkCount,
    junkFoodCount,
  });

  const strategy = getStrategy({
    protein: totalProtein,
    proteinGoal: goals.proteinGoal,
    calories: totalCalories,
    calorieGoal: goals.calorieGoal,
    netCalories,
    workoutMinutes: totalWorkoutMinutes,
    workoutGoal: goals.workoutGoal,
    water,
    waterGoal: goals.waterGoal,
    sleep,
    sleepGoal: goals.sleepGoal,
  });

  const avoidList = getAvoidList({
    calories: totalCalories,
    calorieGoal: goals.calorieGoal,
    sweetDrinkCount,
    junkFoodCount,
    sleep,
    sleepGoal: goals.sleepGoal,
  });

  const tomorrowAdjustment = getTomorrowAdjustment({
    netCalories,
    calorieGoal: goals.calorieGoal,
    protein: totalProtein,
    proteinGoal: goals.proteinGoal,
    workoutMinutes: totalWorkoutMinutes,
    workoutGoal: goals.workoutGoal,
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
              Coach.
              <br />
              Read the system.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Coach / v3.0
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
            <p className="text-sm text-zinc-400">System Score</p>
            <p className="mt-3 text-7xl font-black">
              {systemScore}
              <span className="text-2xl text-zinc-500"> / 100</span>
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${systemScore}%` }}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
              <p className="text-sm text-red-300">Main Problem</p>
              <p className="mt-2 text-2xl font-black">{mainProblem}</p>
            </div>

            <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-300">Recommended Strategy</p>
              <p className="mt-2 text-lg font-bold leading-7">{strategy}</p>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Avoid Now</p>
              <ul className="mt-3 grid gap-2 text-sm text-zinc-300">
                {avoidList.map((item) => (
                  <li key={item}>โ€ข {item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Tomorrow Adjustment</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {tomorrowAdjustment}
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
              <p className="text-sm text-zinc-400">Current Numbers</p>
              <h2 className="mt-1 text-2xl font-bold">
                {formatDateForMenu(selectedDate)}
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <MetricCard
                  label="Food Calories"
                  value={`${totalCalories}`}
                  unit="kcal"
                  note={`Goal ${goals.calorieGoal} kcal`}
                  score={getCalorieScore(totalCalories, goals.calorieGoal)}
                />

                <MetricCard
                  label="Workout Burn"
                  value={`${totalBurn}`}
                  unit="kcal"
                  note="estimated"
                  score={workoutScore}
                />

                <MetricCard
                  label="Net Calories"
                  value={`${netCalories}`}
                  unit="kcal"
                  note="food - burn"
                  score={calorieScore}
                />

                <MetricCard
                  label="Protein"
                  value={`${totalProtein}`}
                  unit="g"
                  note={`Goal ${goals.proteinGoal}g`}
                  score={proteinScore}
                />

                <MetricCard
                  label="Water"
                  value={`${water}`}
                  unit="L"
                  note={`Goal ${goals.waterGoal}L`}
                  score={waterScore}
                />

                <MetricCard
                  label="Sleep"
                  value={`${sleep}`}
                  unit="h"
                  note={`Goal ${goals.sleepGoal}h`}
                  score={sleepScore}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
              <p className="text-sm text-zinc-400">Signals</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <SmallSignal label="Food logs" value={String(selectedFoodLogs.length)} />
                <SmallSignal label="Workout logs" value={String(selectedWorkoutLogs.length)} />
                <SmallSignal label="Workout min" value={String(totalWorkoutMinutes)} />
                <SmallSignal label="Sweet drinks" value={String(sweetDrinkCount)} />
                <SmallSignal label="Junk food" value={String(junkFoodCount)} />
                <SmallSignal label="Food quality" value={`${foodQualityScore}/100`} />
                <SmallSignal label="Snack level" value={dailyLog?.snackLevel ?? "-"} />
                <SmallSignal label="Mood" value={dailyLog?.mood ?? "-"} />
                <SmallSignal label="Weight" value={dailyLog?.weight ? `${dailyLog.weight} kg` : "-"} />
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  note,
  score,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  score: number;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-2 text-4xl font-black">
            {value}
            <span className="ml-1 text-lg text-zinc-500">{unit}</span>
          </p>
          <p className="mt-2 text-xs text-zinc-500">{note}</p>
        </div>

        <div className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
          {score}
        </div>
      </div>
    </div>
  );
}

function SmallSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}
