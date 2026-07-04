"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  waterGoal: number;
  sleepGoal: number;
};

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
  mealType: string;
  foodName: string;
  protein: number;
  sweetDrink: boolean;
  junkFood: boolean;
  notes: string;
};

type WorkoutLog = {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  gamesPlayed?: number;
  steps?: number;
  distanceKm?: number;
  swimmingMeters?: number;
  notes: string;
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

function safeParseArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
    mealType: typeof raw.mealType === "string" ? raw.mealType : "other",
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

function normalizeWorkoutLog(raw: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    type: typeof raw.type === "string" ? raw.type : "other",
    durationMinutes:
      typeof raw.durationMinutes === "number" ? raw.durationMinutes : 0,
    gamesPlayed: typeof raw.gamesPlayed === "number" ? raw.gamesPlayed : 0,
    steps: typeof raw.steps === "number" ? raw.steps : 0,
    distanceKm: typeof raw.distanceKm === "number" ? raw.distanceKm : 0,
    swimmingMeters:
      typeof raw.swimmingMeters === "number" ? raw.swimmingMeters : 0,
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
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

function getBaselineScore(log: DailyLog | undefined, goals: Goals) {
  if (!log) return 0;

  return Math.round(
    getSleepScore(log.sleep, goals.sleepGoal) * 0.35 +
      getWaterScore(log.water, goals.waterGoal) * 0.3 +
      getSnackScore(log.snackLevel) * 0.25 +
      getMoodScore(log.mood) * 0.1
  );
}

function getProteinScore(protein: number, proteinGoal: number) {
  if (protein >= proteinGoal) return 100;
  if (protein >= proteinGoal * 0.85) return 85;
  if (protein >= proteinGoal * 0.65) return 65;
  if (protein >= proteinGoal * 0.5) return 45;
  if (protein > 0) return 25;
  return 0;
}

function getWorkoutScore(minutes: number) {
  if (minutes >= 180) return 100;
  if (minutes >= 120) return 85;
  if (minutes >= 60) return 65;
  if (minutes >= 30) return 45;
  if (minutes > 0) return 25;
  return 0;
}

function getCoachPlan({
  dailyLog,
  totalProtein,
  workoutMinutes,
  sweetDrinkCount,
  junkCount,
  goals,
}: {
  dailyLog?: DailyLog;
  totalProtein: number;
  workoutMinutes: number;
  sweetDrinkCount: number;
  junkCount: number;
  goals: Goals;
}) {
  if (!dailyLog) {
    return {
      priority: "Start with Daily Check-in.",
      why: "Coach needs your baseline first: weight, sleep, water, snack level, and mood. Without this, the app can only guess.",
      nextAction: "Go to Dashboard and save today’s check-in first. After that, log your first meal in Food.",
    };
  }

  if (dailyLog.sleep > 0 && dailyLog.sleep < goals.sleepGoal - 1) {
    return {
      priority: "Recover first. Sleep is the main issue today.",
      why: `Your sleep goal is ${goals.sleepGoal}h. Low sleep increases cravings and makes training feel worse.`,
      nextAction:
        "Keep workout light today. Hit water, protein, and try to sleep earlier tonight.",
    };
  }

  if (dailyLog.water < goals.waterGoal) {
    return {
      priority: "Drink water before judging hunger.",
      why: `Your water goal is ${goals.waterGoal}L. When water is low, hunger and cravings can feel stronger than they actually are.`,
      nextAction: `Push water to at least ${goals.waterGoal}L today. Then decide if you still need more food.`,
    };
  }

  if (totalProtein < goals.proteinGoal * 0.65) {
    return {
      priority: "Protein is too low.",
      why: `Your protein goal is ${goals.proteinGoal}g. If protein stays low while cutting weight, you risk looking flat and losing muscle.`,
      nextAction:
        "Add one protein-focused item: whey, chicken, eggs, tuna, Greek yogurt, or lean pork.",
    };
  }

  if (workoutMinutes === 0) {
    return {
      priority: "Move today.",
      why: "You do not need a perfect workout. You just need to keep the system active.",
      nextAction:
        "Do badminton, walk 30 minutes, or Home Workout 15 minutes: push-ups, squats, plank.",
    };
  }

  if (sweetDrinkCount > 0 || junkCount > 0) {
    return {
      priority: "Clean up the next meal.",
      why: "One sweet drink or junk meal does not ruin the day. The problem is letting it turn into a full-day spiral.",
      nextAction:
        "Next meal: protein first, no sweet drink, no extra snack. Do not starve.",
    };
  }

  return {
    priority: "Good day. Maintain the system.",
    why: "Baseline, food, and movement are under control. This is the kind of boring day that creates results.",
    nextAction: "Do not add random snacks. Finish water and sleep on time.",
  };
}

function getMissionList({
  dailyLog,
  totalProtein,
  workoutMinutes,
  sweetDrinkCount,
  junkCount,
  goals,
}: {
  dailyLog?: DailyLog;
  totalProtein: number;
  workoutMinutes: number;
  sweetDrinkCount: number;
  junkCount: number;
  goals: Goals;
}) {
  const missions: string[] = [];

  if (!dailyLog) missions.push("Save Daily Check-in");
  if (dailyLog && dailyLog.water < goals.waterGoal) {
    missions.push(`Drink water to ${goals.waterGoal}L`);
  }
  if (dailyLog && dailyLog.sleep < goals.sleepGoal - 1) {
    missions.push("Sleep earlier tonight");
  }
  if (totalProtein < goals.proteinGoal) {
    missions.push(`Add ${Math.round(goals.proteinGoal - totalProtein)}g protein`);
  }
  if (workoutMinutes === 0) missions.push("Log one workout or walk");
  if (sweetDrinkCount > 0) missions.push("No more sweet drink today");
  if (junkCount > 0) missions.push("Next meal must be cleaner");

  if (missions.length === 0) {
    return ["Maintain today. Do not add random snacks."];
  }

  return missions.slice(0, 4);
}

export default function CoachPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);

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
  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);
  const sweetDrinkCount = selectedFoodLogs.filter((log) => log.sweetDrink).length;
  const junkCount = selectedFoodLogs.filter((log) => log.junkFood).length;

  const workoutMinutes = selectedWorkoutLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );

  const baselineScore = getBaselineScore(dailyLog, goals);
  const proteinScore = getProteinScore(totalProtein, goals.proteinGoal);
  const workoutScore = getWorkoutScore(workoutMinutes);

  const overallScore = Math.round(
    baselineScore * 0.4 + proteinScore * 0.35 + workoutScore * 0.25
  );

  const coachPlan = getCoachPlan({
    dailyLog,
    totalProtein,
    workoutMinutes,
    sweetDrinkCount,
    junkCount,
    goals,
  });

  const missions = getMissionList({
    dailyLog,
    totalProtein,
    workoutMinutes,
    sweetDrinkCount,
    junkCount,
    goals,
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
              Decide the next move.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Coach / v1.4
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
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <p className="text-sm text-zinc-400">Today Score</p>

            <p className="mt-3 text-7xl font-black tracking-tight md:text-8xl">
              {overallScore}
              <span className="ml-2 text-3xl text-zinc-500">/100</span>
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${overallScore}%` }}
              />
            </div>

            <p className="mt-5 text-sm leading-6 text-zinc-300">
              {coachPlan.priority}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 md:p-6">
            <p className="text-sm text-emerald-300">Coach Decision</p>
            <h2 className="mt-1 text-3xl font-black">{coachPlan.priority}</h2>

            <div className="mt-5 grid gap-3">
              <CoachBox label="Why this matters" text={coachPlan.why} />
              <CoachBox label="Next action" text={coachPlan.nextAction} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Today Missions</p>
            <h2 className="mt-1 text-2xl font-bold">{formatDateForMenu(selectedDate)}</h2>

            <div className="mt-5 grid gap-3">
              {missions.map((mission) => (
                <div
                  key={mission}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200"
                >
                  {mission}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard
              label="Baseline"
              value={`${baselineScore}/100`}
              note={
                dailyLog
                  ? `${dailyLog.weight || "-"} kg · ${dailyLog.sleep || 0}/${goals.sleepGoal}h sleep · ${
                      dailyLog.water || 0
                    }/${goals.waterGoal}L water`
                  : "No daily check-in"
              }
            />

            <SummaryCard
              label="Food"
              value={`${totalProtein}g`}
              note={`Goal ${goals.proteinGoal}g · ${proteinLeft}g left`}
            />

            <SummaryCard
              label="Workout"
              value={`${workoutMinutes} min`}
              note={`${selectedWorkoutLogs.length} logs`}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <DetailPanel title="Food Today">
            {selectedFoodLogs.length === 0 ? (
              <EmptyText text="No food logs for this date" />
            ) : (
              selectedFoodLogs
                .slice()
                .reverse()
                .map((log) => (
                  <SmallRow
                    key={log.id}
                    title={log.foodName}
                    detail={`${log.protein}g protein${
                      log.sweetDrink ? " · sweet drink" : ""
                    }${log.junkFood ? " · junk food" : ""}`}
                  />
                ))
            )}
          </DetailPanel>

          <DetailPanel title="Workout Today">
            {selectedWorkoutLogs.length === 0 ? (
              <EmptyText text="No workout logs for this date" />
            ) : (
              selectedWorkoutLogs
                .slice()
                .reverse()
                .map((log) => (
                  <SmallRow
                    key={log.id}
                    title={log.type}
                    detail={`${log.durationMinutes} minutes${
                      log.distanceKm ? ` · ${log.distanceKm} km` : ""
                    }${log.steps ? ` · ${log.steps} steps` : ""}`}
                  />
                ))
            )}
          </DetailPanel>
        </section>
      </section>
    </main>
  );
}

function CoachBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-200">{text}</p>
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
      <p className="mt-2 text-sm leading-6 text-zinc-500">{note}</p>
    </div>
  );
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <p className="text-sm text-zinc-400">Details</p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </div>
  );
}

function SmallRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4">
      <p className="font-bold capitalize">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
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