"use client";

import { useEffect, useState } from "react";
import AppNav from "../AppNav";

const storageKeys = {
  daily: "operation-recode-logs-no-waist",
  food: "operation-recode-food-logs",
  workout: "operation-recode-workout-logs",
};

type BackupData = {
  version: string;
  exportedAt: string;
  daily: unknown[];
  food: unknown[];
  workout: unknown[];
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

function createBackup(): BackupData {
  return {
    version: "operation-recode-backup-v1",
    exportedAt: new Date().toISOString(),
    daily: safeParseArray(localStorage.getItem(storageKeys.daily)),
    food: safeParseArray(localStorage.getItem(storageKeys.food)),
    workout: safeParseArray(localStorage.getItem(storageKeys.workout)),
  };
}

export default function SettingsPage() {
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
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
    refreshCounts();
  }, []);

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
    setStatus("All local data cleared.");
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
              Protect the data.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Settings / v0.1
          </div>
        </nav>

        <section className="grid gap-5 md:grid-cols-3">
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
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}