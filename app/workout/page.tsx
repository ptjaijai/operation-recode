"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";
import { canSaveWithoutLogin, getSaveLockMessage } from "../../lib/recode/auth-mode";

type WorkoutType =
  | "badminton"
  | "home-workout"
  | "walking"
  | "running"
  | "swimming"
  | "stretching"
  | "other";

type BadmintonPlayType = "casual" | "practice" | "match";

type WorkoutLog = {
  id: string;
  date: string;
  type: WorkoutType;
  durationMinutes: number;
  estimatedCalories: number;
  playType: BadmintonPlayType;
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
};

const storageKeys = {
  workout: "operation-recode-workout-logs",
  goals: "operation-recode-goals",
  daily: "operation-recode-logs-no-waist",
};

const defaultGoals: Goals = {
  targetWeight: 60,
  proteinGoal: 120,
  calorieGoal: 1800,
  waterGoal: 2,
  sleepGoal: 7,
  workoutGoal: 30,
};

const defaultBodyWeight = 70;

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

function loadDailyLogs(): DailyLog[] {
  const saved = localStorage.getItem(storageKeys.daily);
  const parsed = safeParseArray<Record<string, unknown>>(saved);

  return parsed
    .map((item) => ({
      date: typeof item.date === "string" ? item.date : today,
      weight:
        typeof item.weight === "number"
          ? item.weight
          : typeof item.weightKg === "number"
          ? item.weightKg
          : 0,
    }))
    .filter((item) => item.weight > 0);
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

function normalizePlayType(value: unknown): BadmintonPlayType {
  if (value === "casual" || value === "practice" || value === "match") {
    return value;
  }

  return "casual";
}

function getWorkoutLabel(type: WorkoutType) {
  if (type === "badminton") return "Badminton";
  if (type === "home-workout") return "Home Workout";
  if (type === "walking") return "Walking";
  if (type === "running") return "Running";
  if (type === "swimming") return "Swimming";
  if (type === "stretching") return "Stretching";
  return "Other";
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

function createEmptyForm(date: string): WorkoutLog {
  return {
    id: crypto.randomUUID(),
    date,
    type: "badminton",
    durationMinutes: 60,
    estimatedCalories: 0,
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
    notes: "",
  };
}

function normalizeLog(raw: Record<string, unknown>): WorkoutLog {
  const details =
    raw.details && typeof raw.details === "object"
      ? (raw.details as Record<string, unknown>)
      : raw;

  const type = normalizeWorkoutType(raw.type);
  const durationMinutes = toNumber(
    raw.durationMinutes ?? raw.duration_minutes,
    0
  );

  return {
    id: isUuid(raw.id) ? String(raw.id) : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    type,
    durationMinutes,
    estimatedCalories: toNumber(
      raw.estimatedCalories ?? raw.estimated_calories,
      0
    ),
    playType: normalizePlayType(details.playType),
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

function databaseToWorkoutLog(row: Record<string, unknown>): WorkoutLog {
  return normalizeLog({
    id: row.id,
    date: row.date,
    type: row.type,
    duration_minutes: row.duration_minutes,
    estimated_calories: row.estimated_calories,
    details: row.details,
    notes: row.notes,
  });
}

function workoutLogToDatabase(log: WorkoutLog, userId: string) {
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

function mergeLogsById(localLogs: WorkoutLog[], cloudLogs: WorkoutLog[]) {
  const map = new Map<string, WorkoutLog>();

  cloudLogs.forEach((log) => {
    map.set(log.id, log);
  });

  localLogs.forEach((log) => {
    map.set(log.id, log);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getWorkoutCoachMessage({
  minutes,
  calories,
  workoutGoal,
}: {
  minutes: number;
  calories: number;
  workoutGoal: number;
}) {
  if (minutes === 0) {
    return "No workout logged yet. Do at least a short walk or home workout.";
  }

  if (minutes < workoutGoal) {
    return `Good start. You are ${workoutGoal - minutes} minutes short of todayโ€s workout goal.`;
  }

  if (calories >= 500) {
    return "Big burn day. Make sure protein and water are not too low.";
  }

  return "Workout goal reached. Keep the rest of the day clean and recover well.";
}

export default function WorkoutPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<WorkoutLog>(() => createEmptyForm(today));
  const [editingId, setEditingId] = useState("");
  const [userId, setUserId] = useState("");
  const [syncStatus, setSyncStatus] = useState("Loading local workout data...");

  useEffect(() => {
    async function loadWorkoutData() {
      setGoals(loadGoals());
      setDailyLogs(loadDailyLogs());

      const saved = localStorage.getItem(storageKeys.workout);
      let localLogs: WorkoutLog[] = [];

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
          setSyncStatus("Not logged in. Workout logs are local only.");
          return;
        }

        setUserId(userData.user.id);
        setSyncStatus("Loading cloud workout logs...");

        const { data, error } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("date", { ascending: true });

        if (error) {
          setSyncStatus(`Cloud load failed: ${error.message}`);
          return;
        }

        const cloudLogs = (data ?? []).map((item) =>
          databaseToWorkoutLog(item as Record<string, unknown>)
        );

        const mergedLogs = mergeLogsById(localLogs, cloudLogs);

        setLogs(mergedLogs);
        localStorage.setItem(storageKeys.workout, JSON.stringify(mergedLogs));

        if (mergedLogs.length > 0) {
          const rows = mergedLogs.map((log) =>
            workoutLogToDatabase(log, userData.user!.id)
          );

          const { error: upsertError } = await supabase
            .from("workout_logs")
            .upsert(rows, { onConflict: "id" });

          if (upsertError) {
            setSyncStatus(`Cloud sync failed: ${upsertError.message}`);
            return;
          }
        }

        setSyncStatus("Workout logs synced with Supabase.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadWorkoutData();
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKeys.workout, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (editingId) return;

    setForm((current) => ({
      ...current,
      date: selectedDate,
    }));
  }, [selectedDate, editingId]);

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

  const selectedWeight = useMemo(() => {
    const exactDay = dailyLogs.find((log) => log.date === selectedDate && log.weight > 0);
    if (exactDay) return exactDay.weight;

    const latestBefore = dailyLogs
      .filter((log) => log.weight > 0 && log.date <= selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    if (latestBefore) return latestBefore.weight;

    const latestAny = dailyLogs
      .filter((log) => log.weight > 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return latestAny?.weight ?? defaultBodyWeight;
  }, [dailyLogs, selectedDate]);

  const liveEstimatedCalories = estimateCalories({
    type: form.type,
    weightKg: selectedWeight,
    minutes: Number(form.durationMinutes),
  });

  const totalMinutes = selectedLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );

  const totalBurn = selectedLogs.reduce(
    (sum, log) => sum + log.estimatedCalories,
    0
  );

  const workoutLeft = Math.max(goals.workoutGoal - totalMinutes, 0);
  const workoutPercent = Math.min((totalMinutes / goals.workoutGoal) * 100, 100);

  async function saveLogToCloud(log: WorkoutLog) {
    if (!userId) {
      setSyncStatus("Saved locally. Login to sync workout logs.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("workout_logs")
        .upsert(workoutLogToDatabase(log, userId), { onConflict: "id" });

      if (error) {
        setSyncStatus(`Saved locally, cloud sync failed: ${error.message}`);
        return;
      }

      setSyncStatus(
        editingId ? "Workout log updated and synced." : "Workout log saved and synced."
      );
    } catch (error) {
      setSyncStatus(
        error instanceof Error
          ? `Saved locally, cloud sync failed: ${error.message}`
          : "Saved locally, cloud sync failed."
      );
    }
  }

  function startEditWorkout(log: WorkoutLog) {
    setEditingId(log.id);
    setSelectedDate(log.date);
    setForm({
      ...log,
      durationMinutes: Number(log.durationMinutes),
      estimatedCalories: Number(log.estimatedCalories),
      gamesPlayed: Number(log.gamesPlayed),
      steps: Number(log.steps),
      distanceKm: Number(log.distanceKm),
      swimmingMeters: Number(log.swimmingMeters),
      laps: Number(log.laps),
      pushupSets: Number(log.pushupSets),
      pushupReps: Number(log.pushupReps),
      squatSets: Number(log.squatSets),
      squatReps: Number(log.squatReps),
      plankSets: Number(log.plankSets),
      plankMinutes: Number(log.plankMinutes),
    });
    setSyncStatus(`Editing ${getWorkoutLabel(log.type)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId("");
    setForm(createEmptyForm(selectedDate));
    setSyncStatus(userId ? "Edit cancelled. Cloud sync is ready." : "Edit cancelled.");
  }

  async function saveWorkout() {
    if (Number(form.durationMinutes) <= 0) {
      alert("Enter workout duration first.");
      return;
    }

    const savedLog: WorkoutLog = {
      ...form,
      id: editingId || crypto.randomUUID(),
      date: selectedDate,
      durationMinutes: Number(form.durationMinutes),
      estimatedCalories: liveEstimatedCalories,
      gamesPlayed: Number(form.gamesPlayed),
      steps: Number(form.steps),
      distanceKm: Number(form.distanceKm),
      swimmingMeters: Number(form.swimmingMeters),
      laps: Number(form.laps),
      pushupSets: Number(form.pushupSets),
      pushupReps: Number(form.pushupReps),
      squatSets: Number(form.squatSets),
      squatReps: Number(form.squatReps),
      plankSets: Number(form.plankSets),
      plankMinutes: Number(form.plankMinutes),
      notes: form.notes.trim(),
    };

    const nextLogs = editingId
      ? logs.map((log) => (log.id === editingId ? savedLog : log))
      : [...logs, savedLog];

    setLogs(nextLogs);
    localStorage.setItem(storageKeys.workout, JSON.stringify(nextLogs));

    await saveLogToCloud(savedLog);

    setEditingId("");
    setForm(createEmptyForm(selectedDate));
  }

  async function quickSaveWorkout(type: WorkoutType, minutes: number) {
    const newLog: WorkoutLog = {
      ...createEmptyForm(selectedDate),
      id: crypto.randomUUID(),
      date: selectedDate,
      type,
      durationMinutes: minutes,
      estimatedCalories: estimateCalories({
        type,
        weightKg: selectedWeight,
        minutes,
      }),
      notes: "Quick add",
    };

    const nextLogs = [...logs, newLog];

    setLogs(nextLogs);
    localStorage.setItem(storageKeys.workout, JSON.stringify(nextLogs));

    await saveLogToCloud(newLog);
  }

  async function deleteWorkout(id: string) {
    const targetLog = logs.find((log) => log.id === id);
    const confirmed = confirm(
      `Delete ${targetLog ? getWorkoutLabel(targetLog.type) : "this workout log"}?`
    );

    if (!confirmed) return;

    const nextLogs = logs.filter((log) => log.id !== id);

    setLogs(nextLogs);
    localStorage.setItem(storageKeys.workout, JSON.stringify(nextLogs));

    if (editingId === id) {
      setEditingId("");
      setForm(createEmptyForm(selectedDate));
    }

    if (!userId) {
      setSyncStatus("Deleted locally. Login to sync deletions.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);

      if (error) {
        setSyncStatus(`Deleted locally, cloud delete failed: ${error.message}`);
        return;
      }

      setSyncStatus("Workout log deleted from cloud.");
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
              Workout Tracker.
              <br />
              Add or edit.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Workout / v2.1
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
            <p className="text-sm text-zinc-400">Quick Add</p>
            <h2 className="mt-1 text-2xl font-bold">Fast workout log</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <QuickButton label="Badminton 120 min" onClick={() => quickSaveWorkout("badminton", 120)} />
              <QuickButton label="Badminton 180 min" onClick={() => quickSaveWorkout("badminton", 180)} />
              <QuickButton label="Walk 30 min" onClick={() => quickSaveWorkout("walking", 30)} />
              <QuickButton label="Walk 45 min" onClick={() => quickSaveWorkout("walking", 45)} />
              <QuickButton label="Home 15 min" onClick={() => quickSaveWorkout("home-workout", 15)} />
              <QuickButton label="Stretch 15 min" onClick={() => quickSaveWorkout("stretching", 15)} />
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                {editingId ? "Editing Workout Log" : "Workout Check-in"}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {editingId ? "Update workout" : "Manual log"}
              </h2>

              {editingId && (
                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  Editing mode is on. Press Cancel Edit to add a new workout instead.
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-zinc-500">Workout Type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({ ...form, type: event.target.value as WorkoutType })
                    }
                    className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  >
                    <option value="badminton">Badminton</option>
                    <option value="home-workout">Home Workout</option>
                    <option value="walking">Walking</option>
                    <option value="running">Running</option>
                    <option value="swimming">Swimming</option>
                    <option value="stretching">Stretching</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={String(form.durationMinutes)}
                  onChange={(value) =>
                    setForm({ ...form, durationMinutes: Number(value) })
                  }
                />

                {form.type === "badminton" && (
                  <>
                    <label className="block">
                      <span className="text-xs text-zinc-500">Play Type</span>
                      <select
                        value={form.playType}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            playType: event.target.value as BadmintonPlayType,
                          })
                        }
                        className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                      >
                        <option value="casual">Casual</option>
                        <option value="practice">Practice</option>
                        <option value="match">Match</option>
                      </select>
                    </label>

                    <Input
                      label="Games Played"
                      type="number"
                      value={String(form.gamesPlayed)}
                      onChange={(value) =>
                        setForm({ ...form, gamesPlayed: Number(value) })
                      }
                    />
                  </>
                )}

                {(form.type === "walking" || form.type === "running") && (
                  <>
                    <Input
                      label="Steps"
                      type="number"
                      value={String(form.steps)}
                      onChange={(value) =>
                        setForm({ ...form, steps: Number(value) })
                      }
                    />

                    <Input
                      label="Distance (km)"
                      type="number"
                      step="0.1"
                      value={String(form.distanceKm)}
                      onChange={(value) =>
                        setForm({ ...form, distanceKm: Number(value) })
                      }
                    />
                  </>
                )}

                {form.type === "swimming" && (
                  <>
                    <Input
                      label="Swimming Meters"
                      type="number"
                      value={String(form.swimmingMeters)}
                      onChange={(value) =>
                        setForm({ ...form, swimmingMeters: Number(value) })
                      }
                    />

                    <Input
                      label="Laps"
                      type="number"
                      value={String(form.laps)}
                      onChange={(value) =>
                        setForm({ ...form, laps: Number(value) })
                      }
                    />
                  </>
                )}

                {form.type === "home-workout" && (
                  <>
                    <Input
                      label="Push-ups Sets"
                      type="number"
                      value={String(form.pushupSets)}
                      onChange={(value) =>
                        setForm({ ...form, pushupSets: Number(value) })
                      }
                    />

                    <Input
                      label="Push-ups Reps"
                      type="number"
                      value={String(form.pushupReps)}
                      onChange={(value) =>
                        setForm({ ...form, pushupReps: Number(value) })
                      }
                    />

                    <Input
                      label="Squat Sets"
                      type="number"
                      value={String(form.squatSets)}
                      onChange={(value) =>
                        setForm({ ...form, squatSets: Number(value) })
                      }
                    />

                    <Input
                      label="Squat Reps"
                      type="number"
                      value={String(form.squatReps)}
                      onChange={(value) =>
                        setForm({ ...form, squatReps: Number(value) })
                      }
                    />

                    <Input
                      label="Plank Sets"
                      type="number"
                      value={String(form.plankSets)}
                      onChange={(value) =>
                        setForm({ ...form, plankSets: Number(value) })
                      }
                    />

                    <Input
                      label="Plank Minutes / set"
                      type="number"
                      step="0.1"
                      value={String(form.plankMinutes)}
                      onChange={(value) =>
                        setForm({ ...form, plankMinutes: Number(value) })
                      }
                    />
                  </>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-300">Estimated Burn</p>
                <p className="mt-2 text-4xl font-black">
                  {liveEstimatedCalories}
                  <span className="ml-1 text-lg text-zinc-400">kcal</span>
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Formula uses MET ร— weight ร— duration. Weight used: {selectedWeight} kg
                </p>
              </div>

              <label className="mt-3 block">
                <span className="text-xs text-zinc-500">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Workout intensity, knee status, energy, or anything to remember"
                  className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  onClick={saveWorkout}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
                >
                  {editingId ? "Update Workout + Sync" : "Save Workout + Sync"}
                </button>

                <button
                  onClick={cancelEdit}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 font-bold text-zinc-300 transition hover:bg-zinc-800"
                >
                  {editingId ? "Cancel Edit" : "Clear Form"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Today Summary</p>
            <h2 className="mt-1 text-2xl font-bold">{formatDateForMenu(selectedDate)}</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Workout Time</p>
                <p className="mt-2 text-5xl font-black">
                  {totalMinutes}
                  <span className="ml-1 text-xl text-zinc-500">min</span>
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${workoutPercent}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-zinc-400">
                  Goal {goals.workoutGoal} min ยท{" "}
                  {workoutLeft > 0 ? `${workoutLeft} min left` : "target reached"}
                </p>
              </div>

              <div className="rounded-3xl bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Estimated Burn</p>
                <p className="mt-2 text-5xl font-black">
                  {totalBurn}
                  <span className="ml-1 text-xl text-zinc-500">kcal</span>
                </p>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {getWorkoutCoachMessage({
                    minutes: totalMinutes,
                    calories: totalBurn,
                    workoutGoal: goals.workoutGoal,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Workout History</p>
              <h3 className="mt-1 text-2xl font-bold">Workout logs</h3>

              <div className="mt-5 grid gap-3">
                {selectedLogs.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-900 p-5 text-sm text-zinc-500">
                    No workout log for this date
                  </div>
                ) : (
                  selectedLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div
                        key={log.id}
                        className={
                          editingId === log.id
                            ? "rounded-2xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-sm"
                            : "rounded-2xl bg-zinc-900 p-4 text-sm"
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{getWorkoutLabel(log.type)}</p>
                            <p className="mt-1 text-zinc-500">
                              {log.durationMinutes} min ยท {log.estimatedCalories} kcal
                            </p>
                            {log.type === "badminton" && (
                              <p className="mt-1 text-zinc-500">
                                {log.playType} ยท {log.gamesPlayed} games
                              </p>
                            )}
                            {(log.type === "walking" || log.type === "running") && (
                              <p className="mt-1 text-zinc-500">
                                {log.distanceKm} km ยท {log.steps} steps
                              </p>
                            )}
                            {log.type === "swimming" && (
                              <p className="mt-1 text-zinc-500">
                                {log.swimmingMeters} m ยท {log.laps} laps
                              </p>
                            )}
                            {log.type === "home-workout" && (
                              <p className="mt-1 text-zinc-500">
                                Push {log.pushupSets}ร—{log.pushupReps} ยท Squat{" "}
                                {log.squatSets}ร—{log.squatReps} ยท Plank{" "}
                                {log.plankSets}ร—{log.plankMinutes}m
                              </p>
                            )}
                            {log.notes && (
                              <p className="mt-2 text-xs leading-5 text-zinc-500">
                                {log.notes}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-2">
                            <button
                              onClick={() => startEditWorkout(log)}
                              className="rounded-xl border border-emerald-400/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteWorkout(log.id)}
                              className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
                            >
                              Delete
                            </button>
                          </div>
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

function QuickButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm font-bold text-zinc-200 hover:bg-zinc-800"
    >
      {label}
    </button>
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

