"use client";

import { useEffect, useState } from "react";
import AppNav from "../AppNav";
import { createClient } from "../../lib/supabase/client";

const storageKeys = {
  daily: "operation-recode-logs-no-waist",
  food: "operation-recode-food-logs",
  workout: "operation-recode-workout-logs",
  goals: "operation-recode-goals",
};

type Goals = {
  targetWeight: number;
  proteinGoal: number;
  calorieGoal: number;
  waterGoal: number;
  sleepGoal: number;
  workoutGoal: number;
};

type BackupData = {
  version: string;
  exportedAt: string;
  goals: Goals;
  daily: unknown[];
  food: unknown[];
  workout: unknown[];
};

const defaultGoals: Goals = {
  targetWeight: 60,
  proteinGoal: 120,
  calorieGoal: 1800,
  waterGoal: 2,
  sleepGoal: 7,
  workoutGoal: 30,
};

function safeParseArray(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
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
    protein_goal: goals.proteinGoal,
    calorie_goal: goals.calorieGoal,
    water_goal: goals.waterGoal,
    sleep_goal: goals.sleepGoal,
    workout_goal: goals.workoutGoal,
    updated_at: new Date().toISOString(),
  };
}

function createBackup(): BackupData {
  return {
    version: "operation-recode-backup-v5",
    exportedAt: new Date().toISOString(),
    goals: loadLocalGoals(),
    daily: safeParseArray(localStorage.getItem(storageKeys.daily)),
    food: safeParseArray(localStorage.getItem(storageKeys.food)),
    workout: safeParseArray(localStorage.getItem(storageKeys.workout)),
  };
}

export default function SettingsPage() {
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("Checking login...");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  const [counts, setCounts] = useState({
    daily: 0,
    food: 0,
    workout: 0,
  });

  function refreshCounts() {
    setCounts({
      daily: safeParseArray(localStorage.getItem(storageKeys.daily)).length,
      food: safeParseArray(localStorage.getItem(storageKeys.food)).length,
      workout: safeParseArray(localStorage.getItem(storageKeys.workout)).length,
    });
  }

  useEffect(() => {
    async function loadSettings() {
      refreshCounts();

      const localGoals = loadLocalGoals();
      setGoals(localGoals);

      try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          setSyncStatus("Not logged in. Goals are saved locally only.");
          return;
        }

        setUserEmail(userData.user.email ?? "");
        setUserId(userData.user.id);

        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (error) {
          setSyncStatus(`Could not load cloud goals: ${error.message}`);
          return;
        }

        if (data) {
          const cloudGoals = goalsFromDatabase(data);
          setGoals(cloudGoals);
          localStorage.setItem(storageKeys.goals, JSON.stringify(cloudGoals));
          setSyncStatus("Cloud goals loaded.");
          return;
        }

        const { error: insertError } = await supabase
          .from("goals")
          .insert(goalsToDatabase(localGoals, userData.user.id));

        if (insertError) {
          setSyncStatus(`Could not create cloud goals: ${insertError.message}`);
          return;
        }

        setSyncStatus("Cloud goals created from local settings.");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Could not connect to Supabase."
        );
      }
    }

    loadSettings();
  }, []);

  async function saveGoals() {
    localStorage.setItem(storageKeys.goals, JSON.stringify(goals));

    if (!userId) {
      setStatus("Goals saved locally. Login first to sync to cloud.");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("goals")
        .upsert(goalsToDatabase(goals, userId), {
          onConflict: "user_id",
        });

      if (error) {
        setStatus(`Local saved, but cloud sync failed: ${error.message}`);
        return;
      }

      setStatus("Goals saved and synced to Supabase.");
      setSyncStatus("Cloud goals synced.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Local saved, but cloud sync failed: ${error.message}`
          : "Local saved, but cloud sync failed."
      );
    }
  }

  async function resetGoals() {
    setGoals(defaultGoals);
    localStorage.setItem(storageKeys.goals, JSON.stringify(defaultGoals));

    if (userId) {
      try {
        const supabase = createClient();

        await supabase.from("goals").upsert(goalsToDatabase(defaultGoals, userId), {
          onConflict: "user_id",
        });
      } catch {
        // local reset is enough if cloud fails
      }
    }

    setStatus("Goals reset to default.");
  }

  function generateBackup() {
    const backup = createBackup();
    const text = JSON.stringify(backup, null, 2);

    setBackupText(text);
    setStatus("Backup generated. Copy it or download the file.");
  }

  function downloadBackup() {
    const backup = createBackup();
    const text = JSON.stringify(backup, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const fileName = `operation-recode-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${fileName}`);
  }

  async function copyBackup() {
    const text = backupText || JSON.stringify(createBackup(), null, 2);

    try {
      await navigator.clipboard.writeText(text);
      setBackupText(text);
      setStatus("Backup copied to clipboard.");
    } catch {
      setBackupText(text);
      setStatus("Could not copy automatically. Select the text and copy manually.");
    }
  }

  function importBackup() {
    if (!importText.trim()) {
      alert("Paste backup JSON first.");
      return;
    }

    try {
      const parsed = JSON.parse(importText) as Partial<BackupData>;

      if (!Array.isArray(parsed.daily)) throw new Error("Missing daily data");
      if (!Array.isArray(parsed.food)) throw new Error("Missing food data");
      if (!Array.isArray(parsed.workout)) throw new Error("Missing workout data");

      localStorage.setItem(storageKeys.daily, JSON.stringify(parsed.daily));
      localStorage.setItem(storageKeys.food, JSON.stringify(parsed.food));
      localStorage.setItem(storageKeys.workout, JSON.stringify(parsed.workout));

      if (parsed.goals) {
        const importedGoals: Goals = {
          targetWeight: toNumber(parsed.goals.targetWeight, defaultGoals.targetWeight),
          proteinGoal: toNumber(parsed.goals.proteinGoal, defaultGoals.proteinGoal),
          calorieGoal: toNumber(parsed.goals.calorieGoal, defaultGoals.calorieGoal),
          waterGoal: toNumber(parsed.goals.waterGoal, defaultGoals.waterGoal),
          sleepGoal: toNumber(parsed.goals.sleepGoal, defaultGoals.sleepGoal),
          workoutGoal: toNumber(parsed.goals.workoutGoal, defaultGoals.workoutGoal),
        };

        localStorage.setItem(storageKeys.goals, JSON.stringify(importedGoals));
        setGoals(importedGoals);
      }

      refreshCounts();
      setStatus(
        "Backup imported locally. Press Save Goals if you want to sync imported goals."
      );
    } catch {
      alert("Invalid backup JSON. Check the text and try again.");
    }
  }

  function clearAllData() {
    const confirmed = confirm(
      "Clear all Operation: Recode local data? This deletes Daily, Food, and Workout logs from this browser only."
    );

    if (!confirmed) return;

    localStorage.removeItem(storageKeys.daily);
    localStorage.removeItem(storageKeys.food);
    localStorage.removeItem(storageKeys.workout);

    setBackupText("");
    setImportText("");
    refreshCounts();
    setStatus("All local data cleared. Cloud data and Goals were not deleted.");
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
              Settings.
              <br />
              Sync the goals.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Settings / v0.5
          </div>
        </nav>

        <section className="mb-5 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">Supabase Sync</p>
          <p className="mt-2 text-2xl font-black">
            {userEmail ? `Logged in: ${userEmail}` : "Not logged in"}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{syncStatus}</p>

          {!userEmail && (
            <a
              href="/login"
              className="mt-4 inline-block rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
            >
              Go to Login
            </a>
          )}
        </section>

        <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Target Weight" value={`${goals.targetWeight} kg`} />
          <StatCard label="Protein Goal" value={`${goals.proteinGoal}g`} />
          <StatCard label="Calorie Goal" value={`${goals.calorieGoal} kcal`} />
          <StatCard label="Water Goal" value={`${goals.waterGoal}L`} />
          <StatCard label="Sleep Goal" value={`${goals.sleepGoal}h`} />
          <StatCard label="Workout Goal" value={`${goals.workoutGoal} min`} />
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Goals</p>
          <h2 className="mt-1 text-2xl font-bold">Set your targets</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input
              label="Target Weight (kg)"
              type="number"
              step="0.1"
              value={String(goals.targetWeight)}
              onChange={(value) =>
                setGoals({ ...goals, targetWeight: Number(value) })
              }
            />

            <Input
              label="Protein Goal (g)"
              type="number"
              value={String(goals.proteinGoal)}
              onChange={(value) =>
                setGoals({ ...goals, proteinGoal: Number(value) })
              }
            />

            <Input
              label="Calorie Goal (kcal/day)"
              type="number"
              value={String(goals.calorieGoal)}
              onChange={(value) =>
                setGoals({ ...goals, calorieGoal: Number(value) })
              }
            />

            <Input
              label="Water Goal (L)"
              type="number"
              step="0.1"
              value={String(goals.waterGoal)}
              onChange={(value) =>
                setGoals({ ...goals, waterGoal: Number(value) })
              }
            />

            <Input
              label="Sleep Goal (hours)"
              type="number"
              step="0.1"
              value={String(goals.sleepGoal)}
              onChange={(value) =>
                setGoals({ ...goals, sleepGoal: Number(value) })
              }
            />

            <Input
              label="Workout Goal (min/day)"
              type="number"
              value={String(goals.workoutGoal)}
              onChange={(value) =>
                setGoals({ ...goals, workoutGoal: Number(value) })
              }
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              onClick={saveGoals}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
            >
              Save Goals + Sync
            </button>

            <button
              onClick={resetGoals}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
            >
              Reset Default Goals
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <StatCard label="Daily Logs" value={String(counts.daily)} />
          <StatCard label="Food Logs" value={String(counts.food)} />
          <StatCard label="Workout Logs" value={String(counts.workout)} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Backup</p>
            <h2 className="mt-1 text-2xl font-bold">Export local data</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This still backs up local browser data. Cloud sync for logs comes in the next step.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button
                onClick={generateBackup}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
              >
                Generate
              </button>

              <button
                onClick={copyBackup}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
              >
                Copy
              </button>

              <button
                onClick={downloadBackup}
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
              >
                Download
              </button>
            </div>

            <textarea
              value={backupText}
              onChange={(event) => setBackupText(event.target.value)}
              placeholder="Backup JSON will appear here"
              className="mt-4 min-h-80 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-5 text-zinc-300 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Restore</p>
            <h2 className="mt-1 text-2xl font-bold">Import local backup</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Paste backup JSON here. Importing replaces local browser data only for now.
            </p>

            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste backup JSON here"
              className="mt-5 min-h-80 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-5 text-zinc-300 outline-none focus:border-emerald-400"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                onClick={importBackup}
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
              >
                Import Backup
              </button>

              <button
                onClick={clearAllData}
                className="rounded-2xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-950"
              >
                Clear Local Logs
              </button>
            </div>
          </div>
        </section>

        {status && (
          <section className="mt-5 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-200">
            {status}
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-black md:text-4xl">{value}</p>
    </div>
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