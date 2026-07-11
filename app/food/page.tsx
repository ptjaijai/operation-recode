"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";
import {
  AUTH_MODE_EVENT,
  canSaveWithoutLogin,
  getAuthMode,
  getSaveLockMessage,
} from "../../lib/recode/auth-mode";

type SaveMode = "loading" | "sync" | "guest" | "locked";

type Goals = {
  proteinGoal: number;
  calorieGoal: number;
};

type FoodLog = {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  protein: number;
  calories: number;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
  createdAt: string;
};

type QuickFood = {
  id: string;
  title: string;
  mealType: string;
  foodName: string;
  protein: number;
  calories: number;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
  useCount: number;
  createdAt: string;
  lastUsedAt: string;
};

type FoodForm = {
  mealType: string;
  foodName: string;
  protein: string;
  calories: string;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
  saveToQuick: boolean;
};

const storageKeys = {
  goals: "operation-recode-goals",
  food: "operation-recode-food-logs",
  quickFoods: "operation-recode-quick-foods",
};

const defaultGoals: Goals = {
  proteinGoal: 120,
  calorieGoal: 1800,
};

const defaultQuickFoods: QuickFood[] = [
  {
    id: "preset-whey",
    title: "Whey 1 scoop",
    mealType: "drink",
    foodName: "Whey 1 scoop",
    protein: 25,
    calories: 120,
    sweetDrink: false,
    junkFood: false,
    notes: "Default quick food",
    useCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "preset-eggs",
    title: "Eggs 2 pcs",
    mealType: "breakfast",
    foodName: "Eggs 2 pcs",
    protein: 12,
    calories: 140,
    sweetDrink: false,
    junkFood: false,
    notes: "Default quick food",
    useCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "preset-chicken",
    title: "Chicken breast",
    mealType: "lunch",
    foodName: "Chicken breast",
    protein: 35,
    calories: 180,
    sweetDrink: false,
    junkFood: false,
    notes: "Default quick food",
    useCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "preset-milk",
    title: "Milk",
    mealType: "drink",
    foodName: "Milk",
    protein: 8,
    calories: 130,
    sweetDrink: false,
    junkFood: false,
    notes: "Default quick food",
    useCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
];

const emptyForm: FoodForm = {
  mealType: "lunch",
  foodName: "",
  protein: "",
  calories: "",
  sweetDrink: false,
  junkFood: false,
  notes: "",
  saveToQuick: false,
};

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function makeLocalId() {
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function safeArray(value: string | null) {
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
      proteinGoal: toNumber(parsed.proteinGoal, defaultGoals.proteinGoal),
      calorieGoal: toNumber(parsed.calorieGoal, defaultGoals.calorieGoal),
    };
  } catch {
    return defaultGoals;
  }
}

function normalizeFoodLog(value: unknown): FoodLog | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  const foodName =
    typeof item.foodName === "string"
      ? item.foodName
      : typeof item.food_name === "string"
      ? item.food_name
      : "";

  if (!foodName.trim()) return null;

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : makeLocalId(),
    date:
      typeof item.date === "string" && item.date.trim()
        ? item.date
        : todayString(),
    mealType:
      typeof item.mealType === "string"
        ? item.mealType
        : typeof item.meal_type === "string"
        ? item.meal_type
        : "other",
    foodName,
    protein: toNumber(item.protein, 0),
    calories: toNumber(item.calories, 0),
    sweetDrink: Boolean(
      typeof item.sweetDrink === "boolean" ? item.sweetDrink : item.sweet_drink
    ),
    junkFood: Boolean(
      typeof item.junkFood === "boolean" ? item.junkFood : item.junk_food
    ),
    notes:
      typeof item.notes === "string"
        ? item.notes
        : typeof item.note === "string"
        ? item.note
        : "",
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : typeof item.created_at === "string"
        ? item.created_at
        : new Date().toISOString(),
  };
}

function normalizeQuickFood(value: unknown): QuickFood | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  const foodName =
    typeof item.foodName === "string" && item.foodName.trim()
      ? item.foodName
      : typeof item.title === "string"
      ? item.title
      : "";

  if (!foodName.trim()) return null;

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : makeLocalId(),
    title:
      typeof item.title === "string" && item.title.trim()
        ? item.title
        : foodName,
    mealType: typeof item.mealType === "string" ? item.mealType : "other",
    foodName,
    protein: toNumber(item.protein, 0),
    calories: toNumber(item.calories, 0),
    sweetDrink: Boolean(item.sweetDrink),
    junkFood: Boolean(item.junkFood),
    notes: typeof item.notes === "string" ? item.notes : "",
    useCount: toNumber(item.useCount, 0),
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
    lastUsedAt:
      typeof item.lastUsedAt === "string"
        ? item.lastUsedAt
        : new Date().toISOString(),
  };
}

function loadLocalFoodLogs() {
  return safeArray(localStorage.getItem(storageKeys.food))
    .map(normalizeFoodLog)
    .filter(Boolean) as FoodLog[];
}

function loadQuickFoods() {
  const saved = safeArray(localStorage.getItem(storageKeys.quickFoods))
    .map(normalizeQuickFood)
    .filter(Boolean) as QuickFood[];

  if (saved.length > 0) return saved;

  localStorage.setItem(storageKeys.quickFoods, JSON.stringify(defaultQuickFoods));
  return defaultQuickFoods;
}

function saveLocalFoodLogs(logs: FoodLog[]) {
  localStorage.setItem(storageKeys.food, JSON.stringify(logs));
}

function saveQuickFoods(foods: QuickFood[]) {
  localStorage.setItem(storageKeys.quickFoods, JSON.stringify(foods));
}

function foodLogFromDatabase(row: Record<string, unknown>): FoodLog {
  return {
    id: String(row.id),
    date: String(row.date),
    mealType: String(row.meal_type ?? "other"),
    foodName: String(row.food_name ?? ""),
    protein: toNumber(row.protein, 0),
    calories: toNumber(row.calories, 0),
    sweetDrink: Boolean(row.sweet_drink),
    junkFood: Boolean(row.junk_food),
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function foodLogToDatabase(log: FoodLog, userId: string) {
  return {
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

function quickFoodFromLog(log: FoodLog): QuickFood {
  return {
    id: makeLocalId(),
    title: log.foodName,
    mealType: log.mealType,
    foodName: log.foodName,
    protein: log.protein,
    calories: log.calories,
    sweetDrink: log.sweetDrink,
    junkFood: log.junkFood,
    notes: log.notes,
    useCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
}

function quickFoodToLog(food: QuickFood, date: string): FoodLog {
  return {
    id: makeLocalId(),
    date,
    mealType: food.mealType,
    foodName: food.foodName,
    protein: food.protein,
    calories: food.calories,
    sweetDrink: food.sweetDrink,
    junkFood: food.junkFood,
    notes: food.notes,
    createdAt: new Date().toISOString(),
  };
}

function quickFoodKey(food: {
  foodName: string;
  mealType: string;
  protein: number;
  calories: number;
}) {
  return `${food.foodName.trim().toLowerCase()}-${food.mealType}-${food.protein}-${food.calories}`;
}

function mealLabel(mealType: string) {
  if (mealType === "breakfast") return "Breakfast";
  if (mealType === "lunch") return "Lunch";
  if (mealType === "dinner") return "Dinner";
  if (mealType === "snack") return "Snack";
  if (mealType === "drink") return "Drink";
  return "Other";
}

export default function FoodPage() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [quickFoods, setQuickFoods] = useState<QuickFood[]>([]);
  const [form, setForm] = useState<FoodForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saveMode, setSaveMode] = useState<SaveMode>("loading");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("Loading food tracker...");

  const canWrite = saveMode === "sync" || saveMode === "guest";

  useEffect(() => {
    async function loadFoodPage() {
      setGoals(loadGoals());

      const localLogs = loadLocalFoodLogs();
      const localQuickFoods = loadQuickFoods();

      setFoodLogs(localLogs);
      setQuickFoods(localQuickFoods);

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;

        if (currentUser) {
          setUserId(currentUser.id);
          setSaveMode("sync");
          setMessage("Logged in. Food logs can sync.");

          const { data: cloudRows, error } = await supabase
            .from("food_logs")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(400);

          if (error) {
            setMessage(`Cloud food load failed: ${error.message}`);
            return;
          }

          if (cloudRows && cloudRows.length > 0) {
            const cloudLogs = cloudRows.map((row) =>
              foodLogFromDatabase(row as Record<string, unknown>)
            );

            setFoodLogs(cloudLogs);
            saveLocalFoodLogs(cloudLogs);
          }

          return;
        }

        if (getAuthMode() === "guest") {
          setSaveMode("guest");
          setMessage("Guest Mode. Food logs save on this device only.");
          return;
        }

        setSaveMode("locked");
        setMessage("Food saving is locked. Login or use Guest Mode first.");
      } catch (error) {
        if (getAuthMode() === "guest") {
          setSaveMode("guest");
          setMessage("Guest Mode. Food logs save on this device only.");
          return;
        }

        setSaveMode("locked");
        setMessage(
          error instanceof Error
            ? error.message
            : "Food saving is locked. Login or use Guest Mode first."
        );
      }
    }

    loadFoodPage();

    function refreshMode() {
      if (getAuthMode() === "guest") {
        setSaveMode("guest");
        setMessage("Guest Mode. Food logs save on this device only.");
      }
    }

    window.addEventListener(AUTH_MODE_EVENT, refreshMode);
    window.addEventListener("focus", refreshMode);

    return () => {
      window.removeEventListener(AUTH_MODE_EVENT, refreshMode);
      window.removeEventListener("focus", refreshMode);
    };
  }, []);

  const todaysLogs = useMemo(() => {
    return foodLogs
      .filter((log) => log.date === selectedDate)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [foodLogs, selectedDate]);

  const sortedQuickFoods = useMemo(() => {
    return [...quickFoods].sort((a, b) => {
      if (b.useCount !== a.useCount) return b.useCount - a.useCount;
      return b.lastUsedAt.localeCompare(a.lastUsedAt);
    });
  }, [quickFoods]);

  const totalProtein = todaysLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCalories = todaysLogs.reduce((sum, log) => sum + log.calories, 0);
  const sweetDrinkCount = todaysLogs.filter((log) => log.sweetDrink).length;
  const junkFoodCount = todaysLogs.filter((log) => log.junkFood).length;

  const proteinLeft = Math.max(0, goals.proteinGoal - totalProtein);
  const caloriesLeft = goals.calorieGoal - totalCalories;

  function blockIfLocked() {
    if (canWrite || canSaveWithoutLogin()) return false;

    alert(getSaveLockMessage());
    setMessage("Locked. Login or enable Guest Mode before saving food.");
    return true;
  }

  async function syncInsertOrUpdate(log: FoodLog) {
    if (saveMode !== "sync" || !userId) return log;

    const supabase = createClient();

    if (isUuid(log.id)) {
      const { data, error } = await supabase
        .from("food_logs")
        .update(foodLogToDatabase(log, userId))
        .eq("id", log.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      return foodLogFromDatabase(data as Record<string, unknown>);
    }

    const { data, error } = await supabase
      .from("food_logs")
      .insert(foodLogToDatabase(log, userId))
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return foodLogFromDatabase(data as Record<string, unknown>);
  }

  async function addFoodLog(log: FoodLog) {
    const savedLog = await syncInsertOrUpdate(log);

    const nextLogs = [savedLog, ...foodLogs.filter((item) => item.id !== log.id)];

    setFoodLogs(nextLogs);
    saveLocalFoodLogs(nextLogs);

    return savedLog;
  }

  async function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (blockIfLocked()) return;

    if (!form.foodName.trim()) {
      setMessage("Enter food name first.");
      return;
    }

    const nextLog: FoodLog = {
      id: editingId || makeLocalId(),
      date: selectedDate,
      mealType: form.mealType,
      foodName: form.foodName.trim(),
      protein: toNumber(form.protein, 0),
      calories: toNumber(form.calories, 0),
      sweetDrink: form.sweetDrink,
      junkFood: form.junkFood,
      notes: form.notes.trim(),
      createdAt: editingId
        ? foodLogs.find((log) => log.id === editingId)?.createdAt ??
          new Date().toISOString()
        : new Date().toISOString(),
    };

    try {
      const savedLog = await addFoodLog(nextLog);

      if (form.saveToQuick) {
        saveFoodToQuick(savedLog, false);
      }

      setForm(emptyForm);
      setEditingId("");
      setMessage(editingId ? "Food updated." : "Food saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save food failed.");
    }
  }

  function editFood(log: FoodLog) {
    setEditingId(log.id);
    setForm({
      mealType: log.mealType,
      foodName: log.foodName,
      protein: String(log.protein),
      calories: String(log.calories),
      sweetDrink: log.sweetDrink,
      junkFood: log.junkFood,
      notes: log.notes,
      saveToQuick: false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteFood(log: FoodLog) {
    if (blockIfLocked()) return;

    const confirmed = confirm(`Delete ${log.foodName}?`);

    if (!confirmed) return;

    try {
      if (saveMode === "sync" && userId && isUuid(log.id)) {
        const supabase = createClient();

        const { error } = await supabase
          .from("food_logs")
          .delete()
          .eq("id", log.id)
          .eq("user_id", userId);

        if (error) {
          setMessage(error.message);
          return;
        }
      }

      const nextLogs = foodLogs.filter((item) => item.id !== log.id);
      setFoodLogs(nextLogs);
      saveLocalFoodLogs(nextLogs);
      setMessage("Food deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  function saveFoodToQuick(log: FoodLog, showMessage = true) {
    const newQuickFood = quickFoodFromLog(log);
    const newKey = quickFoodKey(newQuickFood);

    const existing = quickFoods.find((food) => quickFoodKey(food) === newKey);

    let nextQuickFoods: QuickFood[];

    if (existing) {
      nextQuickFoods = quickFoods.map((food) =>
        food.id === existing.id
          ? {
              ...food,
              title: newQuickFood.title,
              foodName: newQuickFood.foodName,
              mealType: newQuickFood.mealType,
              protein: newQuickFood.protein,
              calories: newQuickFood.calories,
              sweetDrink: newQuickFood.sweetDrink,
              junkFood: newQuickFood.junkFood,
              notes: newQuickFood.notes,
              lastUsedAt: new Date().toISOString(),
            }
          : food
      );

      if (showMessage) setMessage(`${log.foodName} is already in Quick Save.`);
    } else {
      nextQuickFoods = [newQuickFood, ...quickFoods];

      if (showMessage) setMessage(`${log.foodName} added to Quick Save.`);
    }

    setQuickFoods(nextQuickFoods);
    saveQuickFoods(nextQuickFoods);
  }

  async function quickSaveFood(food: QuickFood) {
    if (blockIfLocked()) return;

    const log = quickFoodToLog(food, selectedDate);

    try {
      await addFoodLog(log);

      const nextQuickFoods = quickFoods.map((item) =>
        item.id === food.id
          ? {
              ...item,
              useCount: item.useCount + 1,
              lastUsedAt: new Date().toISOString(),
            }
          : item
      );

      setQuickFoods(nextQuickFoods);
      saveQuickFoods(nextQuickFoods);

      setMessage(`${food.title} quick saved.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Quick save food failed."
      );
    }
  }

  function deleteQuickFood(food: QuickFood) {
    const confirmed = confirm(`Remove ${food.title} from Quick Save?`);

    if (!confirmed) return;

    const nextQuickFoods = quickFoods.filter((item) => item.id !== food.id);

    setQuickFoods(nextQuickFoods);
    saveQuickFoods(nextQuickFoods);
    setMessage(`${food.title} removed from Quick Save.`);
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyForm);
    setMessage("Edit cancelled.");
  }

  return (
    <main className="recode-food-page min-h-screen text-white">
      <section className="recode-shell mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="recode-kicker">Operation: Recode</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
              Food
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Track protein, calories, and save frequent meals for one-tap logging.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white outline-none"
            />

            <ModeBadge mode={saveMode} />
          </div>
        </section>

        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-zinc-300">
          {message}
        </section>

        {saveMode === "locked" && (
          <section className="mb-5 rounded-[2rem] border border-red-400/25 bg-red-400/10 p-5">
            <p className="text-sm font-black text-red-200">Food saving locked</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Login or continue as Guest Mode before saving food logs.
            </p>
          </section>
        )}

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Protein"
            value={`${Math.round(totalProtein)}g`}
            detail={`${Math.round(proteinLeft)}g left`}
          />

          <SummaryCard
            label="Calories"
            value={`${Math.round(totalCalories)}`}
            detail={
              caloriesLeft >= 0
                ? `${Math.round(caloriesLeft)} kcal left`
                : `${Math.abs(Math.round(caloriesLeft))} kcal over`
            }
          />

          <SummaryCard
            label="Meals"
            value={`${todaysLogs.length}`}
            detail="logged today"
          />

          <SummaryCard
            label="Quality"
            value={`${sweetDrinkCount + junkFoodCount}`}
            detail="sweet / junk flags"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="space-y-5">
            <section className="recode-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                    Quick Save
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    Frequent foods
                  </h2>
                </div>

                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-zinc-400">
                  {quickFoods.length} saved
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Food you eat often will stay here. Press Quick Save to log it today.
              </p>

              <div className="mt-6 grid gap-3">
                {sortedQuickFoods.map((food) => (
                  <div
                    key={food.id}
                    className="rounded-3xl border border-white/5 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-white">
                          {food.title}
                        </p>
                        <p className="mt-1 text-xs font-bold text-zinc-500">
                          {mealLabel(food.mealType)} · {food.protein}g protein ·{" "}
                          {food.calories} kcal
                        </p>
                      </div>

                      <button
                        onClick={() => deleteQuickFood(food)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-500 hover:border-red-400/30 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <button
                      onClick={() => quickSaveFood(food)}
                      className={
                        canWrite
                          ? "mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
                          : "mt-4 w-full rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-black text-red-200"
                      }
                    >
                      {canWrite ? "Quick Save" : "Locked"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="recode-card rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                Manual
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                {editingId ? "Edit food" : "Add food"}
              </h2>

              <form onSubmit={saveFood} className="mt-6 grid gap-4">
                <label className="block">
                  <span className="recode-label">Food name</span>
                  <input
                    value={form.foodName}
                    onChange={(event) =>
                      setForm({ ...form, foodName: event.target.value })
                    }
                    placeholder="เช่น ข้าวมันไก่ / เวย์ / ไข่ต้ม"
                    className="recode-input"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="recode-label">Meal</span>
                    <select
                      value={form.mealType}
                      onChange={(event) =>
                        setForm({ ...form, mealType: event.target.value })
                      }
                      className="recode-input"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                      <option value="drink">Drink</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="recode-label">Protein (g)</span>
                    <input
                      type="number"
                      value={form.protein}
                      onChange={(event) =>
                        setForm({ ...form, protein: event.target.value })
                      }
                      placeholder="0"
                      className="recode-input"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="recode-label">Calories</span>
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(event) =>
                      setForm({ ...form, calories: event.target.value })
                    }
                    placeholder="0"
                    className="recode-input"
                  />
                </label>

                <label className="block">
                  <span className="recode-label">Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                    placeholder="optional"
                    className="recode-input min-h-24 resize-none"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <CheckPill
                    checked={form.sweetDrink}
                    label="Sweet drink"
                    onClick={() =>
                      setForm({ ...form, sweetDrink: !form.sweetDrink })
                    }
                  />

                  <CheckPill
                    checked={form.junkFood}
                    label="Junk food"
                    onClick={() =>
                      setForm({ ...form, junkFood: !form.junkFood })
                    }
                  />

                  <CheckPill
                    checked={form.saveToQuick}
                    label="Save to Quick"
                    onClick={() =>
                      setForm({ ...form, saveToQuick: !form.saveToQuick })
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    className={
                      canWrite
                        ? "recode-button-primary"
                        : "rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-4 text-sm font-black text-red-200"
                    }
                  >
                    {canWrite
                      ? editingId
                        ? "Update Food"
                        : "Save Food"
                      : "Locked"}
                  </button>

                  {editingId ? (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="recode-button-ghost"
                    >
                      Cancel Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setForm(emptyForm)}
                      className="recode-button-ghost"
                    >
                      Clear Form
                    </button>
                  )}
                </div>
              </form>
            </section>
          </section>

          <section className="recode-card rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  Today Log
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  {selectedDate}
                </h2>
              </div>

              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-zinc-400">
                {todaysLogs.length} items
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {todaysLogs.length === 0 && (
                <div className="rounded-3xl border border-white/5 bg-black/20 p-6 text-sm leading-6 text-zinc-500">
                  No food logged yet. Add food manually or use Quick Save.
                </div>
              )}

              {todaysLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-3xl border border-white/5 bg-black/20 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-white">
                          {log.foodName}
                        </p>

                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          {mealLabel(log.mealType)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-zinc-400">
                        {log.protein}g protein · {log.calories} kcal
                      </p>

                      {(log.sweetDrink || log.junkFood || log.notes) && (
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          {log.sweetDrink && "Sweet drink. "}
                          {log.junkFood && "Junk food. "}
                          {log.notes}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 md:min-w-72">
                      <button
                        onClick={() => editFood(log)}
                        className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-zinc-300 hover:bg-white/[0.06]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => saveFoodToQuick(log)}
                        className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black text-emerald-200 hover:bg-emerald-400/15"
                      >
                        Save to Quick
                      </button>

                      <button
                        onClick={() => deleteFood(log)}
                        className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs font-black text-red-200 hover:bg-red-400/15"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function ModeBadge({ mode }: { mode: SaveMode }) {
  if (mode === "sync") {
    return (
      <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">
        ● Sync On
      </div>
    );
  }

  if (mode === "guest") {
    return (
      <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-200">
        ● Guest
      </div>
    );
  }

  if (mode === "locked") {
    return (
      <div className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200">
        ● Locked
      </div>
    );
  }

  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-zinc-400">
      Checking
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="recode-card rounded-[2rem] p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-zinc-500">{detail}</p>
    </div>
  );
}

function CheckPill({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        checked
          ? "rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200"
          : "rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-zinc-400"
      }
    >
      {checked ? "✓ " : ""}
      {label}
    </button>
  );
}