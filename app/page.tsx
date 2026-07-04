"use client";

import { useEffect, useMemo, useState } from "react";

type DailyLog = {
  id: string;
  date: string;
  weight: number;
  sleepHours: number;
  waterLiters: number;
  exercise: string;
  snackLevel: "none" | "light" | "medium" | "heavy";
  mood: number;
  notes: string;
};

const START_WEIGHT = 70;
const GOAL_WEIGHT = 60;
const today = new Date().toISOString().slice(0, 10);

const starterLog: DailyLog = {
  id: "baseline",
  date: today,
  weight: 70,
  sleepHours: 6,
  waterLiters: 2,
  exercise: "Baseline",
  snackLevel: "medium",
  mood: 7,
  notes: "Operation: Recode started.",
};

function getSnackLabel(level: DailyLog["snackLevel"]) {
  if (level === "none") return "No snacks";
  if (level === "light") return "Light";
  if (level === "medium") return "Medium";
  return "Heavy";
}

function getCoachMessage(latest: DailyLog, previous?: DailyLog) {
  if (!previous) {
    return "วันนี้คือจุดเริ่มต้น เก็บข้อมูลจริงก่อน ยังไม่ต้องเพอร์เฟกต์ เป้าหมายคือทำให้ต่อเนื่อง";
  }

  const diff = latest.weight - previous.weight;

  if (diff > 0.5) {
    return "น้ำหนักขึ้นวันนี้ยังไม่ต้องตกใจ อาจเป็นน้ำ โซเดียม คาร์บ หรือเวลาชั่ง ให้ดูค่าเฉลี่ยหลายวันแทน";
  }

  if (diff < -0.4) {
    return "น้ำหนักลงดีมาก แต่ต้องกินโปรตีนให้ถึง เพื่อไม่ให้กล้ามหาย";
  }

  if (latest.snackLevel === "heavy") {
    return "วันนี้ของจุกจิกค่อนข้างเยอะ พรุ่งนี้ไม่ต้องอด แค่ลดขนมลงครึ่งหนึ่งก็พอ";
  }

  if (latest.sleepHours < 6) {
    return "การนอนยังน้อยไป พรุ่งนี้พยายามนอนเร็วขึ้น 30 นาที จะช่วยเรื่องหิวและการฟื้นตัว";
  }

  return "วันนี้อยู่ในทางที่ดี รักษาความต่อเนื่องไว้ ไม่ต้องสุด แค่ไม่หลุดยาวก็ชนะแล้ว";
}

export default function Home() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [form, setForm] = useState<DailyLog>({
    id: crypto.randomUUID(),
    date: today,
    weight: 70,
    sleepHours: 6,
    waterLiters: 2,
    exercise: "",
    snackLevel: "medium",
    mood: 7,
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("operation-recode-logs-no-waist");

    if (saved) {
      setLogs(JSON.parse(saved));
    } else {
      setLogs([starterLog]);
      localStorage.setItem(
        "operation-recode-logs-no-waist",
        JSON.stringify([starterLog])
      );
    }
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem(
        "operation-recode-logs-no-waist",
        JSON.stringify(logs)
      );
    }
  }, [logs]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const latest = sortedLogs[sortedLogs.length - 1] ?? starterLog;
  const previous = sortedLogs[sortedLogs.length - 2];

  const progress = Math.min(
    100,
    Math.max(
      0,
      ((START_WEIGHT - latest.weight) / (START_WEIGHT - GOAL_WEIGHT)) * 100
    )
  );

  const weightLost = START_WEIGHT - latest.weight;
  const remaining = latest.weight - GOAL_WEIGHT;
  const coachMessage = getCoachMessage(latest, previous);

  function saveLog() {
    const newLog: DailyLog = {
      ...form,
      id: crypto.randomUUID(),
      weight: Number(form.weight),
      sleepHours: Number(form.sleepHours),
      waterLiters: Number(form.waterLiters),
      mood: Number(form.mood),
    };

    setLogs((current) => {
      const withoutSameDate = current.filter((log) => log.date !== newLog.date);
      return [...withoutSameDate, newLog];
    });

    setForm((current) => ({
      ...current,
      id: crypto.randomUUID(),
      exercise: "",
      notes: "",
    }));
  }

  function resetData() {
    const confirmed = window.confirm("Reset all Operation: Recode data?");
    if (!confirmed) return;

    setLogs([starterLog]);
    localStorage.setItem(
      "operation-recode-logs-no-waist",
      JSON.stringify([starterLog])
    );
  }

  const chartPoints = sortedLogs.slice(-14);
  const maxWeight = Math.max(...chartPoints.map((log) => log.weight), START_WEIGHT);
  const minWeight = Math.min(...chartPoints.map((log) => log.weight), GOAL_WEIGHT);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <nav className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
              Operation: Recode
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
              Rebuild the body.
              <br />
              Rewrite the habits.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Jai / Phase 1
          </div>
        </nav>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-emerald-950/20 md:p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div>
                <p className="text-sm text-zinc-400">Main Objective</p>
                <h2 className="mt-2 text-5xl font-black md:text-7xl">
                  {latest.weight.toFixed(1)}
                  <span className="mx-3 text-zinc-500">→</span>
                  60
                  <span className="ml-2 text-2xl text-zinc-400">kg</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 md:text-base">
                  โฟกัสหลักคือ น้ำหนักเฉลี่ย 7 วัน + รูปหุ่นรายสัปดาห์ +
                  ความสม่ำเสมอ ไม่ใช้รอบเอวแล้ว เพราะวัดยากและเพี้ยนง่าย
                </p>
              </div>

              <div className="min-w-44 rounded-2xl bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Weight Progress</p>
                <p className="mt-2 text-4xl font-bold">{Math.round(progress)}%</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Lost {weightLost.toFixed(1)} kg / Remaining{" "}
                  {remaining.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Current Weight"
                value={latest.weight.toFixed(1)}
                unit="kg"
                note="Latest log"
              />
              <StatCard
                label="Goal Weight"
                value="60.0"
                unit="kg"
                note="Operation target"
              />
              <StatCard
                label="Sleep"
                value={latest.sleepHours.toFixed(1)}
                unit="hr"
                note="Last check-in"
              />
              <StatCard
                label="Remaining"
                value={remaining.toFixed(1)}
                unit="kg"
                note="To goal"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Daily Check-in</p>
            <h3 className="mt-1 text-2xl font-bold">Log today</h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) => setForm({ ...form, date: value })}
              />
              <Input
                label="Weight (kg)"
                type="number"
                value={String(form.weight)}
                onChange={(value) => setForm({ ...form, weight: Number(value) })}
              />
              <Input
                label="Sleep (hours)"
                type="number"
                value={String(form.sleepHours)}
                onChange={(value) =>
                  setForm({ ...form, sleepHours: Number(value) })
                }
              />
              <Input
                label="Water (liters)"
                type="number"
                value={String(form.waterLiters)}
                onChange={(value) =>
                  setForm({ ...form, waterLiters: Number(value) })
                }
              />
              <Input
                label="Exercise"
                type="text"
                value={form.exercise}
                onChange={(value) => setForm({ ...form, exercise: value })}
              />
              <Input
                label="Mood (1-10)"
                type="number"
                value={String(form.mood)}
                onChange={(value) => setForm({ ...form, mood: Number(value) })}
              />
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-zinc-500">Snack Level</span>
              <select
                value={form.snackLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    snackLevel: event.target.value as DailyLog["snackLevel"],
                  })
                }
                className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              >
                <option value="none">No snacks</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-zinc-500">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="เช่น วันนี้ตีแบด 3 ชม. / กินหมูกระทะ / นอนดึก"
                className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <div className="mt-4 flex gap-3">
              <button
                onClick={saveLog}
                className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
              >
                Save Check-in
              </button>
              <button
                onClick={resetData}
                className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">AI Coach Lite</p>
            <h3 className="mt-1 text-2xl font-bold">Coach Note</h3>
            <p className="mt-4 rounded-2xl bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">
              {coachMessage}
            </p>

            <div className="mt-5 space-y-3">
              <MissionItem label="Protein 120g" done={latest.snackLevel !== "heavy"} />
              <MissionItem label="Water 2.5–3L" done={latest.waterLiters >= 2.5} />
              <MissionItem label="Sleep 7h+" done={latest.sleepHours >= 7} />
              <MissionItem
                label="Snack control"
                done={latest.snackLevel === "none" || latest.snackLevel === "light"}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Progress</p>
                <h3 className="mt-1 text-2xl font-bold">Weight Trend</h3>
              </div>
              <p className="rounded-full bg-zinc-950 px-3 py-1 text-xs text-zinc-500">
                Last {chartPoints.length} logs
              </p>
            </div>

            <div className="mt-6 h-56 rounded-2xl bg-zinc-950 p-4">
              <svg viewBox="0 0 600 180" className="h-full w-full">
                <line x1="20" y1="150" x2="580" y2="150" stroke="#27272a" />
                <line x1="20" y1="30" x2="580" y2="30" stroke="#27272a" />
                {chartPoints.map((log, index) => {
                  const x =
                    chartPoints.length === 1
                      ? 300
                      : 20 + (index / (chartPoints.length - 1)) * 560;
                  const y =
                    150 -
                    ((log.weight - minWeight) /
                      Math.max(1, maxWeight - minWeight)) *
                      120;

                  return (
                    <g key={log.id}>
                      <circle cx={x} cy={y} r="5" fill="#34d399" />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#a1a1aa"
                      >
                        {log.weight.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <StatCard
                label="Water"
                value={latest.waterLiters.toFixed(1)}
                unit="L"
                note="Last check-in"
              />
              <StatCard
                label="Snack"
                value={getSnackLabel(latest.snackLevel)}
                unit=""
                note="Last check-in"
              />
              <StatCard
                label="Photo Check"
                value="Weekly"
                unit=""
                note="Use mirror photos"
              />
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">History</p>
              <h3 className="mt-1 text-2xl font-bold">Latest Logs</h3>
            </div>
            <p className="text-sm text-zinc-500">{logs.length} entries</p>
          </div>

          <div className="mt-5 grid gap-3">
            {[...sortedLogs]
              .reverse()
              .slice(0, 7)
              .map((log) => (
                <div
                  key={log.id}
                  className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-6 md:items-center"
                >
                  <div>
                    <p className="font-bold">{log.date}</p>
                    <p className="text-zinc-500">Mood {log.mood}/10</p>
                  </div>
                  <p>{log.weight.toFixed(1)} kg</p>
                  <p>{log.sleepHours.toFixed(1)} hr sleep</p>
                  <p>{log.waterLiters.toFixed(1)} L water</p>
                  <p>{getSnackLabel(log.snackLevel)}</p>
                  <p className="text-zinc-500">{log.exercise || log.notes || "-"}</p>
                </div>
              ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">
        {value}
        {unit && <span className="ml-1 text-base text-zinc-500">{unit}</span>}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function MissionItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 text-sm">
      <span>{label}</span>
      <span
        className={
          done
            ? "rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-zinc-950"
            : "rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400"
        }
      >
        {done ? "Done" : "Focus"}
      </span>
    </div>
  );
}

function Input({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
      />
    </label>
  );
}