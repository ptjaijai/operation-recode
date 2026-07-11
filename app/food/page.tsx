"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";

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

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  calorieGoal: number;
  waterGoal: number;
  sleepGoal: number;
  workoutGoal: number;
};

type ProteinPreset = {
  name: string;
  protein: number;
  calories: number;
  mealType: MealType;
};

const storageKeys = {
  food: "operation-recode-food-logs",
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

const proteinPresets: ProteinPreset[] = [
  { name: "Whey 1 scoop", protein: 25, calories: 120, mealType: "drink" },
  { name: "Eggs 2 pcs", protein: 12, calories: 140, mealType: "breakfast" },
  { name: "Chicken breast", protein: 35, calories: 180, mealType: "lunch" },
  { name: "Tuna can", protein: 25, calories: 120, mealType: "lunch" },
  { name: "Greek yogurt", protein: 15, calories: 120, mealType: "snack" },
  { name: "Lean pork", protein: 30, calories: 250, mealType: "dinner" },
  { name: "Milk", protein: 8, calories: 130, mealType: "drink" },
  { name: "Grilled chicken", protein: 30, calories: 220, mealType: "lunch" },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

function isUuid(value: unknown) {
  if (typeof value !== "string") return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function loadGoals(): Goals {
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

function createEmptyForm(date: string): FoodLog {
  return {
    id: crypto.randomUUID(),
    date,
    mealType: "lunch",
    foodName: "",
    protein: 0,
    calories: 0,
    sweetDrink: false,
    junkFood: false,
    notes: "",
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

function normalizeLog(raw: Record<string, unknown>): FoodLog {
  return {
    id: isUuid(raw.id) ? String(raw.id) : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    mealType: normalizeMealType(raw.mealType),
    foodName:
      typeof raw.foodName === "string"
        ? raw.foodName
        : typeof raw.name === "string"
        ? raw.name
        : typeof raw.food === "string"
        ? raw.food
        : "",
    protein:
      typeof raw.protein === "number"
        ? raw.protein
        : typeof raw.proteinGrams === "number"
        ? raw.proteinGrams
        : typeof raw.proteinEstimate === "number"
        ? raw.proteinEstimate
        : 0,
    calories:
      typeof raw.calories === "number"
        ? raw.calories
        : typeof raw.kcal === "number"
        ? raw.kcal
        : typeof raw.calorieEstimate === "number"
        ? raw.calorieEstimate
        : 0,
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
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function databaseToFoodLog(row: Record<string, unknown>): FoodLog {
  return {
    id: isUuid(row.id) ? String(row.id) : crypto.randomUUID(),
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

function foodLogToDatabase(log: FoodLog, userId: string) {
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

function mergeLogsById(localLogs: FoodLog[], cloudLogs: FoodLog[]) {
  const map = new Map<string, FoodLog>();

  cloudLogs.forEach((log) => {
    map.set(log.id, log);
  });

  localLogs.forEach((log) => {
    map.set(log.id, log);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getMealLabel(type: MealType) {
  if (type === "breakfast") return "Breakfast";
  if (type === "lunch") return "Lunch";
  if (type === "dinner") return "Dinner";
  if (type === "snack") return "Snack";
  if (type === "drink") return "Drink";
  return "Other";
}

function getProteinScore(protein: number, proteinGoal: number) {
  if (protein >= proteinGoal) return 100;
  if (protein >= proteinGoal * 0.85) return 85;
  if (protein >= proteinGoal * 0.65) return 65;
  if (protein >= proteinGoal * 0.5) return 45;
  if (protein > 0) return 25;
  return 0;
}

function getCalorieText(totalCalories: number, calorieGoal: number) {
  const diff = calorieGoal - totalCalories;

  if (totalCalories === 0) return "No calories logged yet.";
  if (diff > 0) return `${diff} kcal left`;
  if (diff === 0) return "exactly on target";

  return `${Math.abs(diff)} kcal over`;
}

function getFoodCoachMessage({
  protein,
  proteinGoal,
  calories,
  calorieGoal,
  sweetDrinkCount,
  junkCount,
}: {
  protein: number;
  proteinGoal: number;
  calories: number;
  calorieGoal: number;
  sweetDrinkCount: number;
  junkCount: number;
}) {
  const proteinLeft = Math.max(proteinGoal - protein, 0);
  const caloriesOver = Math.max(calories - calorieGoal, 0);

  if (protein === 0 && calories === 0) {
    return "No food log yet. Add your first meal and estimate protein/calories roughly.";
  }

  if (caloriesOver > 0) {
    return `Calories are over by about ${caloriesOver} kcal. Do not starve now, just keep the next meal clean.`;
  }

  if (protein < proteinGoal * 0.65) {
    return `Protein is still low. Try to add around ${proteinLeft}g more protein today.`;
  }

  if (sweetDrinkCount > 0) {
    return "Sweet drink logged. Next drink should be water or zero-calorie.";
  }

  if (junkCount > 0) {
    return "Junk food logged. Do not starve. Just make the next meal cleaner.";
  }

  if (protein >= proteinGoal) {
    return "Protein target reached. Good. Now avoid random snacks.";
  }

  return `Good progress. About ${proteinLeft}g protein left to hit today’s goal.`;
}

export default function FoodPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FoodLog>(() => createEmptyForm(today));
  const [userId, setUserId] = useState("");
  const [syncStatus, setSyncStatus] = useState("Loading local food data...");

  useEffect(() => {
    async function loadFoodData() {
      setGoals(loadGoals());

      const saved = localStorage.getItem(storageKeys.food);
      let localLogs: FoodLog[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            localLogs = parsed.map((item) => normalizeLog(item));
            setLogs(localLogs);
          }
        } catch {
          localLogs = [];
          setLogs([]);
        }
      }

      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setSyncStatus("Not logged in. Food logs are local only.");
          return;
        }

        setUserId(userData.user.id);
        setSyncStatus("Loading cloud food logs...");

        const { data, error } = await supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("date", { ascending: true });

        if (error) {
          setSyncStatus(`Cloud load failed: ${error.message}`);
          return;
        }

        const cloudLogs = (data ?? []).map((item) =>
          databaseToFoodLog(item as Record<string, unknown>)
        );

        const mergedLogs = mergeLogsById(localLogs, cloudLogs);

        setLogs(mergedLogs);
        localStorage.setItem(storageKeys.food, JSON.stringify(mergedLogs));

        if (mergedLogs.length > 0) {
          const rows = mergedLogs.map((log) =>
            foodLogToDatabase(log, userData.user!.id)
          );

          const { error: upsertError } = await supabase
            .from("food_logs")
            .upsert(rows, { onConflict: "id" });

          if (upsertError) {
            setSyncStatus(`Cloud sync failed: ${upsertError.message}`);
            return;
          }
        }

        setSyncStatus("Food logs synced with Supabase.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadFoodData();
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKeys.food, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      date: selectedDate,
    }));
  }, [selectedDate]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    dates.add(today);

    logs.forEach((log) => {
      if (log.date) dates.add(log.date);
    });

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  const selectedLogs = useMemo(() => {
    return logs.filter((log) => log.date === selectedDate);
  }, [logs, selectedDate]);

  const totalProtein = selectedLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCalories = selectedLogs.reduce((sum, log) => sum + log.calories, 0);

  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);
  const calorieLeft = goals.calorieGoal - totalCalories;

  const proteinScore = getProteinScore(totalProtein, goals.proteinGoal);
  const proteinPercent = Math.min((totalProtein / goals.proteinGoal) * 100, 100);
  const caloriePercent = Math.min((totalCalories / goals.calorieGoal) * 100, 100);

  const sweetDrinkCount = selectedLogs.filter((log) => log.sweetDrink).length;
  const junkCount = selectedLogs.filter((log) => log.junkFood).length;

  async function saveLogToCloud(log: FoodLog) {
    if (!userId) {
      setSyncStatus("Saved locally. Login to sync food logs.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("food_logs")
        .upsert(foodLogToDatabase(log, userId), { onConflict: "id" });

      if (error) {
        setSyncStatus(`Saved locally, cloud sync failed: ${error.message}`);
        return;
      }

      setSyncStatus("Food log saved and synced.");
    } catch (error) {
      setSyncStatus(
        error instanceof Error
          ? `Saved locally, cloud sync failed: ${error.message}`
          : "Saved locally, cloud sync failed."
      );
    }
  }

  function applyPreset(preset: ProteinPreset) {
    setForm({
      ...form,
      mealType: preset.mealType,
      foodName: preset.name,
      protein: preset.protein,
      calories: preset.calories,
      sweetDrink: false,
      junkFood: false,
    });
  }

  async function quickSavePreset(preset: ProteinPreset) {
    const newLog: FoodLog = {
      id: crypto.randomUUID(),
      date: selectedDate,
      mealType: preset.mealType,
      foodName: preset.name,
      protein: preset.protein,
      calories: preset.calories,
      sweetDrink: false,
      junkFood: false,
      notes: "Quick add",
    };

    const nextLogs = [...logs, newLog];
    setLogs(nextLogs);
    localStorage.setItem(storageKeys.food, JSON.stringify(nextLogs));

    await saveLogToCloud(newLog);
  }

  async function saveFood() {
    if (!form.foodName.trim()) {
      alert("ใส่ชื่ออาหารก่อน");
      return;
    }

    const newLog: FoodLog = {
      ...form,
      id: crypto.randomUUID(),
      date: selectedDate,
      foodName: form.foodName.trim(),
      protein: Number(form.protein),
      calories: Number(form.calories),
    };

    const nextLogs = [...logs, newLog];
    setLogs(nextLogs);
    localStorage.setItem(storageKeys.food, JSON.stringify(nextLogs));
    setForm(createEmptyForm(selectedDate));

    await saveLogToCloud(newLog);
  }

  async function deleteFood(id: string) {
    const nextLogs = logs.filter((log) => log.id !== id);

    setLogs(nextLogs);
    localStorage.setItem(storageKeys.food, JSON.stringify(nextLogs));

    if (!userId) {
      setSyncStatus("Deleted locally. Login to sync deletions.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);

      if (error) {
        setSyncStatus(`Deleted locally, cloud delete failed: ${error.message}`);
        return;
      }

      setSyncStatus("Food log deleted from cloud.");
    } catch (error) {
      setSyncStatus(
        error instanceof Error
          ? `Deleted locally, cloud delete failed: ${error.message}`
          : "Deleted locally, cloud delete failed."
      );
    }
  }

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
              Food Tracker.
              <br />
              Protein + calories.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Food / v2.0
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
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Quick Add</p>
            <h2 className="mt-1 text-2xl font-bold">Protein presets</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {proteinPresets.map((preset) => (
                <div
                  key={preset.name}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{preset.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {preset.protein}g protein · {preset.calories} kcal ·{" "}
                        {getMealLabel(preset.mealType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyPreset(preset)}
                      className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                    >
                      Use Form
                    </button>

                    <button
                      onClick={() => quickSavePreset(preset)}
                      className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-zinc-950 hover:bg-emerald-300"
                    >
                      Quick Save
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Food Check-in</p>
              <h2 className="mt-1 text-2xl font-bold">Manual log</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-zinc-500">Meal Type</span>
                  <select
                    value={form.mealType}
                    onChange={(event) =>
                      setForm({ ...form, mealType: event.target.value as MealType })
                    }
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="drink">Drink</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <Input
                  label={`Protein (g) / Goal ${goals.proteinGoal}g`}
                  type="number"
                  value={String(form.protein)}
                  onChange={(value) => setForm({ ...form, protein: Number(value) })}
                />

                <Input
                  label={`Calories / Goal ${goals.calorieGoal} kcal`}
                  type="number"
                  value={String(form.calories)}
                  onChange={(value) => setForm({ ...form, calories: Number(value) })}
                />

                <Input
                  label="Food Name"
                  type="text"
                  value={form.foodName}
                  onChange={(value) => setForm({ ...form, foodName: value })}
                />

                <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.sweetDrink}
                    onChange={(event) =>
                      setForm({ ...form, sweetDrink: event.target.checked })
                    }
                  />
                  Sweet drink
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.junkFood}
                    onChange={(event) =>
                      setForm({ ...form, junkFood: event.target.checked })
                    }
                  />
                  Junk food
                </label>
              </div>

              <label className="mt-3 block">
                <span className="text-xs text-zinc-500">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="เช่น ไก่ย่าง / เวย์ / ข้าวมันไก่ / น้ำหวาน"
                  className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <button
                onClick={saveFood}
                className="mt-4 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
              >
                Save Food + Sync
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Today Summary</p>
            <h2 className="mt-1 text-2xl font-bold">{formatDateForMenu(selectedDate)}</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Protein</p>
                <p className="mt-2 text-5xl font-black">
                  {totalProtein}
                  <span className="ml-1 text-xl text-zinc-500">g</span>
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-zinc-400">
                  Score {proteinScore}/100 ·{" "}
                  {proteinLeft > 0 ? `${proteinLeft}g left` : "target reached"}
                </p>
              </div>

              <div className="rounded-3xl bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Calories</p>
                <p className="mt-2 text-5xl font-black">
                  {totalCalories}
                  <span className="ml-1 text-xl text-zinc-500">kcal</span>
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-zinc-400">
                  Goal {goals.calorieGoal} kcal ·{" "}
                  {getCalorieText(totalCalories, goals.calorieGoal)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SmallStat label="Items" value={String(selectedLogs.length)} />
              <SmallStat label="Sweet Drinks" value={String(sweetDrinkCount)} />
              <SmallStat label="Junk Food" value={String(junkCount)} />
            </div>

            <div className="mt-4 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Food Coach Lite</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {getFoodCoachMessage({
                  protein: totalProtein,
                  proteinGoal: goals.proteinGoal,
                  calories: totalCalories,
                  calorieGoal: goals.calorieGoal,
                  sweetDrinkCount,
                  junkCount,
                })}
              </p>
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Food History</p>
              <h3 className="mt-1 text-2xl font-bold">Food logs</h3>

              <div className="mt-5 grid gap-3">
                {selectedLogs.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-900 p-5 text-sm text-zinc-500">
                    No food log for this date
                  </div>
                ) : (
                  selectedLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl bg-zinc-900 p-4 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{log.foodName}</p>
                            <p className="mt-1 text-zinc-500">
                              {getMealLabel(log.mealType)} · {log.protein}g protein ·{" "}
                              {log.calories} kcal
                            </p>
                            <p className="mt-1 text-zinc-500">
                              {log.sweetDrink ? "Sweet drink" : "No sweet drink"} ·{" "}
                              {log.junkFood ? "Junk food" : "Not junk"}
                            </p>
                          </div>

                          <button
                            onClick={() => deleteFood(log.id)}
                            className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
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
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
      />
    </label>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}