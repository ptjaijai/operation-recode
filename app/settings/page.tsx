"use client";

import { useEffect, useState } from "react";
import AppNav from "../AppNav";

const storageKeys = {
  daily: "operation-recode-logs-no-waist",
  food: "operation-recode-food-logs",
  workout: "operation-recode-workout-logs",
  goals: "operation-recode-goals",
};

type Goals = {
  targetWeight: number;
  proteinGoal: number;
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

function createBackup(): BackupData {
  return {
    version: "operation-recode-backup-v3",
    exportedAt: new Date().toISOString(),
    goals: loadGoals(),
    daily: safeParseArray(localStorage.getItem(storageKeys.daily)),
    food: safeParseArray(localStorage.getItem(storageKeys.food)),
    workout: safeParseArray(localStorage.getItem(storageKeys.workout)),
  };
}

export default function SettingsPage() {
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
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
    setGoals(loadGoals());
    refreshCounts();
  }, []);

  function saveGoals() {
    localStorage.setItem(storageKeys.goals, JSON.stringify(goals));
    setStatus("Goals saved. Dashboard, Food, Plan, Coach, and Progress can use these targets.");
  }

  function resetGoals() {
    setGoals(defaultGoals);
    localStorage.setItem(storageKeys.goals, JSON.stringify(defaultGoals));
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

      if (!Array.isArray(parsed.daily)) {
        throw new Error("Missing daily data");
      }

      if (!Array.isArray(parsed.food)) {
        throw new Error("Missing food data");
      }

      if (!Array.isArray(parsed.workout)) {
        throw new Error("Missing workout data");
      }

      localStorage.setItem(storageKeys.daily, JSON.stringify(parsed.daily));
      localStorage.setItem(storageKeys.food, JSON.stringify(parsed.food));
      localStorage.setItem(storageKeys.workout, JSON.stringify(parsed.workout));

      if (parsed.goals) {
        const importedGoals: Goals = {
          targetWeight:
            typeof parsed.goals.targetWeight === "number"
              ? parsed.goals.targetWeight
              : defaultGoals.targetWeight,
          proteinGoal:
            typeof parsed.goals.proteinGoal === "number"
              ? parsed.goals.proteinGoal
              : defaultGoals.proteinGoal,
          waterGoal:
            typeof parsed.goals.waterGoal === "number"
              ? parsed.goals.waterGoal
              : defaultGoals.waterGoal,
          sleepGoal:
            typeof parsed.goals.sleepGoal === "number"
              ? parsed.goals.sleepGoal
              : defaultGoals.sleepGoal,
          workoutGoal:
            typeof parsed.goals.workoutGoal === "number"
              ? parsed.goals.workoutGoal
              : defaultGoals.workoutGoal,
        };

        localStorage.setItem(storageKeys.goals, JSON.stringify(importedGoals));
        setGoals(importedGoals);
      }

      refreshCounts();
      setStatus("Backup imported. Refresh the app pages to see restored data.");
    } catch {
      alert("Invalid backup JSON. Check the text and try again.");
    }
  }

  function clearAllData() {
    const confirmed = confirm(
      "Clear all Operation: Recode data? This will delete Daily, Food, and Workout logs from this browser."
    );

    if (!confirmed) return;

    localStorage.removeItem(storageKeys.daily);
    localStorage.removeItem(storageKeys.food);
    localStorage.removeItem(storageKeys.workout);

    setBackupText("");
    setImportText("");
    refreshCounts();
    setStatus("All local data cleared. Goals were not deleted.");
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
              Control the system.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Settings / v0.3
          </div>
        </nav>

        <section className="grid gap-5 md:grid-cols-5">
          <StatCard label="Target Weight" value={`${goals.targetWeight} kg`} />
          <StatCard label="Protein Goal" value={`${goals.proteinGoal}g`} />
          <StatCard label="Water Goal" value={`${goals.waterGoal}L`} />
          <StatCard label="Sleep Goal" value={`${goals.sleepGoal}h`} />
          <StatCard label="Workout Goal" value={`${goals.workoutGoal} min`} />
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Goals</p>
          <h2 className="mt-1 text-2xl font-bold">Set your targets</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
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
              Save Goals
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
            <h2 className="mt-1 text-2xl font-bold">Export your data</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Use this before changing computers, clearing browser data, or doing big app edits.
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
            <h2 className="mt-1 text-2xl font-bold">Import backup</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Paste backup JSON here. Importing will replace the current local data in this browser.
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
                Clear All Data
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