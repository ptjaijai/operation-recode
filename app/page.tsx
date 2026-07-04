"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "./AppNav";

type SnackLevel = "none" | "low" | "medium" | "high";
type MoodLevel = "great" | "good" | "neutral" | "tired" | "bad";

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
  snackLevel: SnackLevel;
  mood: MoodLevel;
  notes: string;
};

const storageKeys = {
  daily: "operation-recode-logs-no-waist",
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

function createEmptyLog(date: string): DailyLog {
  return {
    id: crypto.randomUUID(),
    date,
    weight: 0,
    sleep: 0,
    water: 0,
    snackLevel: "none",
    mood: "neutral",
    notes: "",
  };
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

  if (typeof value === "string") {
    const clean = value.toLowerCase();

    if (clean.includes("great") || clean.includes("ดีมาก")) return "great";
    if (clean.includes("good") || clean.includes("ดี")) return "good";
    if (clean.includes("tired") || clean.includes("เหนื่อย")) return "tired";
    if (clean.includes("bad") || clean.includes("แย่")) return "bad";
  }

  return "neutral";
}

function normalizeLog(raw: Record<string, unknown>): DailyLog {
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

    snackLevel: normalizeSnackLevel(raw.snackLevel),
    mood: normalizeMood(raw.mood),
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

function getSnackScore(snackLevel?: SnackLevel) {
  if (snackLevel === "none") return 100;
  if (snackLevel === "low") return 80;
  if (snackLevel === "medium") return 50;
  if (snackLevel === "high") return 20;
  return 50;
}

function getMoodScore(mood?: MoodLevel) {
  if (mood === "great") return 100;
  if (mood === "good") return 80;
  if (mood === "neutral") return 60;
  if (mood === "tired") return 40;
  if (mood === "bad") return 20;
  return 60;
}

function getDailyScore(log: DailyLog | undefined, goals: Goals) {
  if (!log) return 0;

  return Math.round(
    getSleepScore(log.sleep, goals.sleepGoal) * 0.35 +
      getWaterScore(log.water, goals.waterGoal) * 0.3 +
      getSnackScore(log.snackLevel) * 0.25 +
      getMoodScore(log.mood) * 0.1
  );
}

function getCoachMessage(log: DailyLog | undefined, goals: Goals) {
  if (!log) return "Start by saving today’s check-in.";

  if (log.sleep > 0 && log.sleep < goals.sleepGoal - 1) {
    return `Priority: sleep. Your goal is ${goals.sleepGoal}h. Low sleep makes cravings harder to control.`;
  }

  if (log.water < goals.waterGoal) {
    return `Priority: water. Push toward ${goals.waterGoal}L before judging hunger.`;
  }

  if (log.snackLevel === "high") {
    return "Priority: snack control. Do not starve, just make the next meal cleaner.";
  }

  if (log.mood === "tired" || log.mood === "bad") {
    return "Priority: recovery. Keep today simple: water, protein, and no panic eating.";
  }

  return "Good baseline day. Now use Food and Workout pages to finish the mission.";
}

function getSnackLabel(level: SnackLevel) {
  if (level === "none") return "None";
  if (level === "low") return "Low";
  if (level === "medium") return "Medium";
  return "High";
}

function getMoodLabel(level: MoodLevel) {
  if (level === "great") return "Great";
  if (level === "good") return "Good";
  if (level === "neutral") return "Neutral";
  if (level === "tired") return "Tired";
  return "Bad";
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<DailyLog>(() => createEmptyLog(today));

  useEffect(() => {
    setGoals(loadGoals());

    const saved = localStorage.getItem(storageKeys.daily);

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
    localStorage.setItem(storageKeys.daily, JSON.stringify(logs));
  }, [logs]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    dates.add(today);

    logs.forEach((log) => {
      if (log.date) dates.add(log.date);
    });

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  const selectedLog = useMemo(() => {
    return logs.find((log) => log.date === selectedDate);
  }, [logs, selectedDate]);

  useEffect(() => {
    if (selectedLog) {
      setForm(selectedLog);
    } else {
      setForm(createEmptyLog(selectedDate));
    }
  }, [selectedDate, selectedLog]);

  const sortedLogs = useMemo(() => {
    return logs.slice().sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const weightLogs = useMemo(() => {
    return logs
      .filter((log) => log.weight > 0)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const latestWeight = weightLogs[weightLogs.length - 1]?.weight ?? 0;
  const firstWeight = weightLogs[0]?.weight ?? 0;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;
  const weightLeft = latestWeight ? Math.max(latestWeight - goals.targetWeight, 0) : 0;

  const last7Weights = weightLogs.slice(-7);
  const avg7 =
    last7Weights.length > 0
      ? last7Weights.reduce((sum, log) => sum + log.weight, 0) / last7Weights.length
      : 0;

  const selectedScore = getDailyScore(selectedLog, goals);
  const latestScore = sortedLogs[0] ? getDailyScore(sortedLogs[0], goals) : 0;

  function saveLog() {
    const newLog: DailyLog = {
      ...form,
      id: selectedLog?.id ?? crypto.randomUUID(),
      date: selectedDate,
      weight: Number(form.weight),
      sleep: Number(form.sleep),
      water: Number(form.water),
      snackLevel: form.snackLevel || "none",
      mood: form.mood || "neutral",
    };

    setLogs((current) => {
      const withoutSameDate = current.filter((log) => log.date !== selectedDate);
      return [...withoutSameDate, newLog].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function deleteLog(date: string) {
    setLogs((current) => current.filter((log) => log.date !== date));

    if (date === selectedDate) {
      setForm(createEmptyLog(selectedDate));
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
              Daily Dashboard.
              <br />
              Rebuild the system.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Dashboard / v1.5
          </div>
        </nav>

        <section className="mb-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <p className="text-sm text-zinc-400">Weight System</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <BigGoalCard
                label="Current"
                value={latestWeight ? latestWeight.toFixed(1) : "-"}
                unit="kg"
                note="latest log"
              />

              <BigGoalCard
                label="Target"
                value={goals.targetWeight.toFixed(1)}
                unit="kg"
                note="from settings"
                highlight
              />

              <BigGoalCard
                label="To Go"
                value={latestWeight ? weightLeft.toFixed(1) : "-"}
                unit="kg"
                note={latestWeight ? "left to target" : "waiting for data"}
              />
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              {weightChange
                ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(
                    1
                  )} kg from first log`
                : "waiting for more data"}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <TopStat label="7-day Avg" value={avg7 ? `${avg7.toFixed(1)} kg` : "-"} />
            <TopStat label="Selected Date" value={formatDateForMenu(selectedDate)} small />
            <TopStat label="Selected Score" value={`${selectedScore} / 100`} />
          </div>
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
            <p className="text-sm text-zinc-400">Daily Check-in</p>
            <h2 className="mt-1 text-2xl font-bold">
              {selectedLog ? "Update baseline" : "Create baseline"}
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                value={String(form.weight)}
                onChange={(value) => setForm({ ...form, weight: Number(value) })}
              />

              <Input
                label={`Sleep (hours) / Goal ${goals.sleepGoal}h`}
                type="number"
                step="0.1"
                value={String(form.sleep)}
                onChange={(value) => setForm({ ...form, sleep: Number(value) })}
              />

              <Input
                label={`Water (L) / Goal ${goals.waterGoal}L`}
                type="number"
                step="0.1"
                value={String(form.water)}
                onChange={(value) => setForm({ ...form, water: Number(value) })}
              />

              <label className="block">
                <span className="text-xs text-zinc-500">Snack Level</span>
                <select
                  value={form.snackLevel}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      snackLevel: event.target.value as SnackLevel,
                    })
                  }
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-500">Mood</span>
                <select
                  value={form.mood}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mood: event.target.value as MoodLevel,
                    })
                  }
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="great">Great</option>
                  <option value="good">Good</option>
                  <option value="neutral">Neutral</option>
                  <option value="tired">Tired</option>
                  <option value="bad">Bad</option>
                </select>
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-zinc-500">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="เช่น วันนี้หิวบ่อย / นอนน้อย / เครียด / กินหลุด"
                className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <button
              onClick={saveLog}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
            >
              {selectedLog ? "Update Check-in" : "Save Check-in"}
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Selected Day Score</p>
            <h2 className="mt-1 text-2xl font-bold">{formatDateForMenu(selectedDate)}</h2>

            <div className="mt-6 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Baseline Score</p>
              <p className="mt-2 text-6xl font-black">
                {selectedScore}
                <span className="text-xl text-zinc-500"> / 100</span>
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${selectedScore}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-300">
                {getCoachMessage(selectedLog, goals)}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <MiniScore
                label="Sleep"
                score={selectedLog ? getSleepScore(selectedLog.sleep, goals.sleepGoal) : 0}
              />
              <MiniScore
                label="Water"
                score={selectedLog ? getWaterScore(selectedLog.water, goals.waterGoal) : 0}
              />
              <MiniScore
                label="Snack"
                score={selectedLog ? getSnackScore(selectedLog.snackLevel) : 0}
              />
              <MiniScore label="Mood" score={selectedLog ? getMoodScore(selectedLog.mood) : 0} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SmallInfo label="Snack" value={selectedLog ? getSnackLabel(selectedLog.snackLevel) : "-"} />
              <SmallInfo label="Mood" value={selectedLog ? getMoodLabel(selectedLog.mood) : "-"} />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">History</p>
          <h3 className="mt-1 text-2xl font-bold">Check-in logs</h3>

          <div className="mt-5 grid gap-3">
            {sortedLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-500">
                No check-in logs yet
              </div>
            ) : (
              sortedLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold">{formatDateForMenu(log.date)}</p>
                    <p className="text-zinc-500">Score {getDailyScore(log, goals)}/100</p>
                  </div>

                  <p>{log.weight ? `${log.weight} kg` : "-"}</p>
                  <p>{log.sleep ? `${log.sleep} hr sleep` : "-"}</p>
                  <p>{log.water ? `${log.water} L water` : "-"}</p>
                  <p>Mood: {getMoodLabel(log.mood)}</p>

                  <button
                    onClick={() => deleteLog(log.date)}
                    className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function BigGoalCard({
  label,
  value,
  unit,
  note,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl border border-emerald-400/50 bg-emerald-400/10 p-5"
          : "rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
      }
    >
      <p className={highlight ? "text-sm text-emerald-300" : "text-sm text-zinc-500"}>
        {label}
      </p>

      <p className="mt-3 text-5xl font-black tracking-tight md:text-6xl">
        {value}
        <span className="ml-1 text-xl text-zinc-500">{unit}</span>
      </p>

      <p className="mt-3 text-sm text-zinc-500">{note}</p>
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

function MiniScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{score}</p>
    </div>
  );
}

function TopStat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-3 font-black ${small ? "text-2xl" : "text-4xl"}`}>{value}</p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}