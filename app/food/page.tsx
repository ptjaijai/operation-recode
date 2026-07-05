"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "other";

type FoodLog = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  protein: number;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
};

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  waterGoal: number;
  sleepGoal: number;
  workoutGoal?: number;
};

type ProteinPreset = {
  name: string;
  protein: number;
  mealType: MealType;
};

const storageKeys = {
  food: "operation-recode-food-logs",
  goals: "operation-recode-goals",
};

const defaultGoals: Goals = {
  targetWeight: 60,
  proteinGoal: 120,
  waterGoal: 2,
  sleepGoal: 7,
  workoutGoal: 30,
};

const proteinPresets: ProteinPreset[] = [
  { name: "Whey 1 scoop", protein: 25, mealType: "drink" },
  { name: "Eggs 2 pcs", protein: 12, mealType: "breakfast" },
  { name: "Chicken breast", protein: 35, mealType: "lunch" },
  { name: "Tuna can", protein: 25, mealType: "lunch" },
  { name: "Greek yogurt", protein: 15, mealType: "snack" },
  { name: "Lean pork", protein: 30, mealType: "dinner" },
  { name: "Milk", protein: 8, mealType: "drink" },
  { name: "Grilled chicken", protein: 30, mealType: "lunch" },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

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
      workoutGoal:
        typeof parsed.workoutGoal === "number"
          ? parsed.workoutGoal
          : defaultGoals.workoutGoal,
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
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
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

function getFoodCoachMessage({
  protein,
  proteinGoal,
  sweetDrinkCount,
  junkCount,
}: {
  protein: number;
  proteinGoal: number;
  sweetDrinkCount: number;
  junkCount: number;
}) {
  const proteinLeft = Math.max(proteinGoal - protein, 0);

  if (protein === 0) {
    return "No food log yet. Add your first meal and estimate protein roughly.";
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

  useEffect(() => {
    setGoals(loadGoals());

    const saved = localStorage.getItem(storageKeys.food);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setLogs(parsed.map((item) => normalizeLog(item)));
      }
    } catch {
      setLogs([]);
    }
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
  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);
  const proteinScore = getProteinScore(totalProtein, goals.proteinGoal);
  const proteinPercent = Math.min((totalProtein / goals.proteinGoal) * 100, 100);

  const sweetDrinkCount = selectedLogs.filter((log) => log.sweetDrink).length;
  const junkCount = selectedLogs.filter((log) => log.junkFood).length;

  function applyPreset(preset: ProteinPreset) {
    setForm({
      ...form,
      mealType: preset.mealType,
      foodName: preset.name,
      protein: preset.protein,
      sweetDrink: preset.mealType === "drink" ? form.sweetDrink : form.sweetDrink,
      junkFood: false,
    });
  }

  function quickSavePreset(preset: ProteinPreset) {
    const newLog: FoodLog = {
      id: crypto.randomUUID(),
      date: selectedDate,
      mealType: preset.mealType,
      foodName: preset.name,
      protein: preset.protein,
      sweetDrink: false,
      junkFood: false,
      notes: "Quick add",
    };

    setLogs((current) => [...current, newLog]);
  }

  function saveFood() {
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
    };

    setLogs((current) => [...current, newLog]);
    setForm(createEmptyForm(selectedDate));
  }

  function deleteFood(id: string) {
    setLogs((current) => current.filter((log) => log.id !== id));
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
              Protein first.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Food / v1.4
          </div>
        </nav>

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
                        {preset.protein}g protein · {getMealLabel(preset.mealType)}
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

                <div className="md:col-span-2">
                  <Input
                    label="Food Name"
                    type="text"
                    value={form.foodName}
                    onChange={(value) => setForm({ ...form, foodName: value })}
                  />
                </div>

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
                Save Food
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Today Summary</p>
            <h2 className="mt-1 text-2xl font-bold">{formatDateForMenu(selectedDate)}</h2>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Protein</p>
                  <p className="mt-2 text-5xl font-black">
                    {totalProtein}
                    <span className="ml-1 text-xl text-zinc-500">g</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500">Goal</p>
                  <p className="mt-2 text-4xl font-black">
                    {goals.proteinGoal}
                    <span className="text-lg text-zinc-500">g</span>
                  </p>
                </div>
              </div>

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
                              {getMealLabel(log.mealType)} · {log.protein}g protein
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