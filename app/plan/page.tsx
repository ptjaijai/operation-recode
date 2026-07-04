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
  protein: number;
  sweetDrink: boolean;
  junkFood: boolean;
};

type WorkoutLog = {
  id: string;
  date: string;
  durationMinutes: number;
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
  };
}

function normalizeWorkoutLog(raw: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    durationMinutes:
      typeof raw.durationMinutes === "number" ? raw.durationMinutes : 0,
  };
}

function getStatusText({
  dailyLog,
  totalProtein,
  workoutMinutes,
  goals,
}: {
  dailyLog?: DailyLog;
  totalProtein: number;
  workoutMinutes: number;
  goals: Goals;
}) {
  if (!dailyLog) return "เริ่มจาก Daily Check-in ก่อน วันนี้ระบบยังไม่มี baseline";

  if (dailyLog.water < goals.waterGoal) {
    return `ตอนนี้ priority คือดื่มน้ำให้ถึง ${goals.waterGoal}L ก่อน`;
  }

  if (totalProtein < goals.proteinGoal * 0.65) {
    return "โปรตีนยังต่ำ วันนี้ต้องเติมโปรตีนก่อนขนม";
  }

  if (workoutMinutes === 0) {
    return "วันนี้ยังไม่มี movement อย่างน้อยเดินหรือ workout สั้น ๆ";
  }

  if (dailyLog.sleep < goals.sleepGoal - 1) {
    return "นอนยังไม่ถึงเป้า คืนนี้เน้น recovery";
  }

  return "วันนี้ระบบค่อนข้างดีแล้ว เหลือแค่ห้ามหลุดยาว";
}

export default function PlanPage() {
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

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

  const dailyLog = dailyLogs.find((log) => log.date === today);
  const todayFoodLogs = foodLogs.filter((log) => log.date === today);
  const todayWorkoutLogs = workoutLogs.filter((log) => log.date === today);

  const totalProtein = todayFoodLogs.reduce((sum, log) => sum + log.protein, 0);
  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);

  const workoutMinutes = todayWorkoutLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );

  const sweetDrinkCount = todayFoodLogs.filter((log) => log.sweetDrink).length;
  const junkCount = todayFoodLogs.filter((log) => log.junkFood).length;

  const missions = useMemo(() => {
    const items = [];

    items.push({
      label: "Daily Check-in",
      done: Boolean(dailyLog),
      detail: dailyLog ? "saved" : "ยังไม่ได้บันทึก baseline",
      href: "/",
    });

    items.push({
      label: "Protein",
      done: totalProtein >= goals.proteinGoal,
      detail:
        totalProtein >= goals.proteinGoal
          ? `${totalProtein}g / ${goals.proteinGoal}g`
          : `ขาดอีก ${Math.round(proteinLeft)}g`,
      href: "/food",
    });

    items.push({
      label: "Water",
      done: Boolean(dailyLog && dailyLog.water >= goals.waterGoal),
      detail: dailyLog
        ? `${dailyLog.water}L / ${goals.waterGoal}L`
        : `goal ${goals.waterGoal}L`,
      href: "/",
    });

    items.push({
      label: "Movement",
      done: workoutMinutes >= 30,
      detail:
        workoutMinutes >= 30
          ? `${workoutMinutes} min`
          : `${workoutMinutes} min / 30 min`,
      href: "/workout",
    });

    items.push({
      label: "Sleep",
      done: Boolean(dailyLog && dailyLog.sleep >= goals.sleepGoal),
      detail: dailyLog
        ? `${dailyLog.sleep}h / ${goals.sleepGoal}h`
        : `goal ${goals.sleepGoal}h`,
      href: "/",
    });

    return items;
  }, [dailyLog, totalProtein, goals, proteinLeft, workoutMinutes]);

  const completedMissions = missions.filter((mission) => mission.done).length;
  const completionPercent = Math.round((completedMissions / missions.length) * 100);

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
              Plan.
              <br />
              Execute today.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Plan / v0.2
          </div>
        </nav>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-6 md:p-8">
            <p className="text-sm text-emerald-300">Today Focus</p>
            <h2 className="mt-2 text-4xl font-black">
              {getStatusText({
                dailyLog,
                totalProtein,
                workoutMinutes,
                goals,
              })}
            </h2>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Mission completion</span>
                <span className="font-bold text-emerald-300">
                  {completedMissions}/{missions.length}
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-zinc-300">
              เป้าหมายวันนี้ไม่ใช่ perfect แต่คือไม่ปล่อยให้วันหลุดไหลยาว
            </p>
          </div>

          <div className="grid gap-3">
            <GoalCard label="Protein Today" value={`${totalProtein}g`} note={`Goal ${goals.proteinGoal}g`} />
            <GoalCard
              label="Water Today"
              value={dailyLog ? `${dailyLog.water}L` : "-"}
              note={`Goal ${goals.waterGoal}L`}
            />
            <GoalCard label="Workout Today" value={`${workoutMinutes} min`} note="Goal 30 min minimum" />
            <GoalCard
              label="Sleep"
              value={dailyLog ? `${dailyLog.sleep}h` : "-"}
              note={`Goal ${goals.sleepGoal}h`}
            />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Today Missions</p>
          <h2 className="mt-1 text-2xl font-bold">What to finish today</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {missions.map((mission) => (
              <MissionCard
                key={mission.label}
                label={mission.label}
                detail={mission.detail}
                done={mission.done}
                href={mission.href}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <PlanCard
            title="Food Plan"
            tag={proteinLeft > 0 ? `${Math.round(proteinLeft)}g left` : "done"}
            items={[
              "มื้อถัดไปเริ่มจากโปรตีนก่อน",
              "ถ้าขาดเยอะ ใช้เวย์ช่วยได้",
              sweetDrinkCount > 0 ? "วันนี้มีน้ำหวานแล้ว ต่อไปเอาน้ำเปล่า/zero" : "ยังไม่มีน้ำหวาน ดีแล้ว",
              junkCount > 0 ? "วันนี้มี junk แล้ว มื้อต่อไป clean" : "ยังไม่มี junk ดีมาก",
            ]}
          />

          <PlanCard
            title="Workout Plan"
            tag={workoutMinutes >= 30 ? "done" : "ยังต้องขยับ"}
            items={[
              workoutMinutes > 0
                ? `วันนี้ขยับแล้ว ${workoutMinutes} นาที`
                : "วันนี้ยังไม่ได้ log workout",
              "ถ้าไม่มีเวลา เดิน 30 นาทีพอ",
              "ถ้าอยู่บ้าน ทำ push-up / squat / plank",
              "ตีแบดก็นับเป็น workout ได้",
            ]}
          />

          <PlanCard
            title="Recovery Plan"
            tag={dailyLog && dailyLog.sleep >= goals.sleepGoal ? "ดี" : "ต้องดูแล"}
            items={[
              dailyLog ? `นอน ${dailyLog.sleep} ชั่วโมง` : "ยังไม่มีข้อมูลการนอน",
              `เป้านอน ${goals.sleepGoal} ชั่วโมง`,
              "นอนน้อย = อยากของหวานง่าย",
              "คืนนี้อย่าปล่อยให้ดึกแบบไม่จำเป็น",
            ]}
          />
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Quick Route</p>
          <h2 className="mt-1 text-2xl font-bold">Log what you did</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <QuickLink href="/" label="Daily Check-in" />
            <QuickLink href="/food" label="Log Food" />
            <QuickLink href="/workout" label="Log Workout" />
            <QuickLink href="/coach" label="Ask Coach" />
          </div>
        </section>
      </section>
    </main>
  );
}

function MissionCard({
  label,
  detail,
  done,
  href,
}: {
  label: string;
  detail: string;
  done: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className={
        done
          ? "rounded-3xl border border-emerald-400/40 bg-emerald-400/10 p-5 hover:bg-emerald-400/20"
          : "rounded-3xl border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900"
      }
    >
      <p className={done ? "text-sm text-emerald-300" : "text-sm text-zinc-500"}>
        {done ? "Done" : "To do"}
      </p>
      <h3 className="mt-2 text-xl font-black">{label}</h3>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
    </a>
  );
}

function GoalCard({
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
      <p className="mt-2 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function PlanCard({
  title,
  tag,
  items,
}: {
  title: string;
  tag: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          {tag}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-black text-zinc-950 hover:bg-emerald-300"
    >
      {label}
    </a>
  );
}