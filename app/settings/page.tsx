"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";
import {
  canSaveWithoutLogin,
  disableGuestMode,
  getAuthMode,
  getSaveLockMessage,
} from "../../lib/recode/auth-mode";

type SaveMode = "loading" | "sync" | "guest" | "locked";

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  calorieGoal: number;
  waterGoal: number;
  sleepGoal: number;
  workoutGoal: number;
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

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function safeParse(value: string | null) {
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

function goalsToDatabase(goals: Goals, userId: string) {
  return {
    user_id: userId,
    target_weight: goals.targetWeight,
    protein_goal: Math.round(goals.proteinGoal),
    calorie_goal: Math.round(goals.calorieGoal),
    water_goal: goals.waterGoal,
    sleep_goal: goals.sleepGoal,
    workout_goal: Math.round(goals.workoutGoal),
    updated_at: new Date().toISOString(),
  };
}

export default function SettingsPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [saveMode, setSaveMode] = useState<SaveMode>("loading");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("Loading settings...");

  const canWrite = saveMode === "sync" || saveMode === "guest";

  const modeLabel = useMemo(() => {
    if (saveMode === "sync") return "Sync On";
    if (saveMode === "guest") return "Guest Mode";
    if (saveMode === "locked") return "Locked";
    return "Checking";
  }, [saveMode]);

  useEffect(() => {
    async function loadSettings() {
      const localGoals = loadLocalGoals();
      setGoals(localGoals);

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;

        if (currentUser) {
          disableGuestMode();
          setUserId(currentUser.id);
          setSaveMode("sync");
          setMessage("Logged in. Settings can sync with Supabase.");

          const { data: goalData, error } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (error) {
            setMessage(`Cloud goals load failed: ${error.message}`);
            return;
          }

          if (goalData) {
            const cloudGoals = goalsFromDatabase(goalData);
            setGoals(cloudGoals);
            localStorage.setItem(storageKeys.goals, JSON.stringify(cloudGoals));
          }

          return;
        }

        if (getAuthMode() === "guest") {
          setSaveMode("guest");
          setMessage("Guest Mode. Settings save locally on this device only.");
          return;
        }

        setSaveMode("locked");
        setMessage("Settings are locked. Login or use Guest Mode first.");
      } catch (error) {
        if (getAuthMode() === "guest") {
          setSaveMode("guest");
          setMessage("Guest Mode. Settings save locally on this device only.");
          return;
        }

        setSaveMode("locked");
        setMessage(
          error instanceof Error
            ? error.message
            : "Settings are locked. Login or use Guest Mode first."
        );
      }
    }

    loadSettings();
  }, []);

  function blockIfLocked() {
    if (canWrite) return false;

    alert(getSaveLockMessage());
    setMessage("Locked. Login or enable Guest Mode before changing settings.");
    return true;
  }

  async function saveGoals() {
    if (blockIfLocked()) return;

    localStorage.setItem(storageKeys.goals, JSON.stringify(goals));

    if (saveMode === "guest" || !userId) {
      setMessage("Goals saved locally in Guest Mode.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("goals")
        .upsert(goalsToDatabase(goals, userId), { onConflict: "user_id" });

      if (error) {
        setMessage(`Saved locally, cloud sync failed: ${error.message}`);
        return;
      }

      setMessage("Goals saved and synced.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Saved locally, cloud sync failed: ${error.message}`
          : "Saved locally, cloud sync failed."
      );
    }
  }

  function exportBackup() {
    const backup = {
      version: "operation-recode-backup-v7",
      exportedAt: new Date().toISOString(),
      saveMode,
      goals,
      dailyLogs: safeParse(localStorage.getItem(storageKeys.daily)),
      foodLogs: safeParse(localStorage.getItem(storageKeys.food)),
      workoutLogs: safeParse(localStorage.getItem(storageKeys.workout)),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `operation-recode-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setMessage("Backup exported.");
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    if (blockIfLocked()) {
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>;

        if (parsed.goals && typeof parsed.goals === "object") {
          const importedGoals = {
            ...defaultGoals,
            ...(parsed.goals as Partial<Goals>),
          };

          setGoals(importedGoals);
          localStorage.setItem(storageKeys.goals, JSON.stringify(importedGoals));
        }

        if (Array.isArray(parsed.dailyLogs)) {
          localStorage.setItem(storageKeys.daily, JSON.stringify(parsed.dailyLogs));
        }

        if (Array.isArray(parsed.foodLogs)) {
          localStorage.setItem(storageKeys.food, JSON.stringify(parsed.foodLogs));
        }

        if (Array.isArray(parsed.workoutLogs)) {
          localStorage.setItem(
            storageKeys.workout,
            JSON.stringify(parsed.workoutLogs)
          );
        }

        setMessage("Backup imported locally. Press Save Goals if you changed goals.");
      } catch {
        setMessage("Import failed. File format is not valid.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function clearLocalLogs() {
    if (blockIfLocked()) return;

    const confirmed = confirm(
      "Clear local daily, food, and workout logs on this browser?"
    );

    if (!confirmed) return;

    localStorage.removeItem(storageKeys.daily);
    localStorage.removeItem(storageKeys.food);
    localStorage.removeItem(storageKeys.workout);

    setMessage("Local logs cleared. Goals are kept.");
  }

  return (
    <main className="min-h-screen text-white">
      <section className="recode-shell mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <AppNav />

        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="recode-kicker">Operation: Recode</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
              Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Goals, backup, and data controls. Saving follows your Account mode.
            </p>
          </div>

          <ModeBadge mode={saveMode} />
        </section>

        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-zinc-300">
          {message}
        </section>

        {saveMode === "locked" && (
          <section className="mb-5 rounded-[2rem] border border-red-400/25 bg-red-400/10 p-5">
            <p className="text-sm font-black text-red-200">Saving Locked</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              You need to login or continue as Guest Mode before changing goals,
              importing backup, or clearing data.
            </p>

            <Link
              href="/account"
              className="mt-4 inline-block rounded-2xl bg-red-400 px-5 py-3 text-sm font-black text-zinc-950"
            >
              Open Account
            </Link>
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="recode-card rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  Goals
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Target settings
                </h2>
              </div>

              <button
                onClick={saveGoals}
                className={
                  canWrite
                    ? "recode-button-primary"
                    : "rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-black text-red-200"
                }
              >
                {canWrite ? "Save Goals" : "Locked"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <NumberField
                label="Target Weight (kg)"
                value={goals.targetWeight}
                step="0.1"
                onChange={(value) =>
                  setGoals({ ...goals, targetWeight: Number(value) })
                }
              />

              <NumberField
                label="Protein Goal (g)"
                value={goals.proteinGoal}
                step="1"
                onChange={(value) =>
                  setGoals({ ...goals, proteinGoal: Number(value) })
                }
              />

              <NumberField
                label="Calorie Goal (kcal)"
                value={goals.calorieGoal}
                step="10"
                onChange={(value) =>
                  setGoals({ ...goals, calorieGoal: Number(value) })
                }
              />

              <NumberField
                label="Water Goal (L)"
                value={goals.waterGoal}
                step="0.25"
                onChange={(value) =>
                  setGoals({ ...goals, waterGoal: Number(value) })
                }
              />

              <NumberField
                label="Sleep Goal (hours)"
                value={goals.sleepGoal}
                step="0.5"
                onChange={(value) =>
                  setGoals({ ...goals, sleepGoal: Number(value) })
                }
              />

              <NumberField
                label="Workout Goal (minutes)"
                value={goals.workoutGoal}
                step="5"
                onChange={(value) =>
                  setGoals({ ...goals, workoutGoal: Number(value) })
                }
              />
            </div>
          </section>

          <section className="space-y-5">
            <section className="recode-card rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                Backup
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Export / Import
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Export is always available. Import changes local data, so it is
                blocked when save mode is Locked.
              </p>

              <div className="mt-6 grid gap-3">
                <button onClick={exportBackup} className="recode-button-primary">
                  Export Backup
                </button>

                <label
                  className={
                    canWrite
                      ? "recode-button-ghost cursor-pointer text-center"
                      : "cursor-not-allowed rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-center text-sm font-black text-red-200"
                  }
                >
                  Import Backup
                  <input
                    type="file"
                    accept="application/json"
                    onChange={importBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">
                Danger
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Clear local logs
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                This clears daily, food, and workout logs stored on this browser.
                Goals are kept.
              </p>

              <button
                onClick={clearLocalLogs}
                className={
                  canWrite
                    ? "mt-6 rounded-2xl bg-red-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-red-300"
                    : "mt-6 rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-black text-red-200"
                }
              >
                {canWrite ? "Clear Local Logs" : "Locked"}
              </button>
            </section>
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
        โ— Sync On
      </div>
    );
  }

  if (mode === "guest") {
    return (
      <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-200">
        โ— Guest Mode
      </div>
    );
  }

  if (mode === "locked") {
    return (
      <div className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200">
        โ— Locked
      </div>
    );
  }

  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-zinc-400">
      Checking...
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="recode-label">{label}</span>
      <input
        type="number"
        step={step}
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="recode-input"
      />
    </label>
  );
}

