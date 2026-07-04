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

function getRiskLevel(score: number) {
  if (score >= 80) return "Low Risk";
  if (score >= 60) return "Medium Risk";
  if (score >= 40) return "High Risk";
  return "Very High Risk";
}

function getMainProblem({
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
      title: "No baseline yet",
      detail:
        "ยังไม่มี Daily Check-in วันนี้ เลยยังวิเคราะห์จริงไม่ได้ ต้องมีน้ำหนัก นอน น้ำ mood และ snack level ก่อน",
    };
  }

  if (dailyLog.sleep > 0 && dailyLog.sleep < goals.sleepGoal - 1) {
    return {
      title: "Sleep debt is driving the day",
      detail:
        "วันนี้ความเสี่ยงหลักคือการนอนน้อย เพราะมันทำให้หิวบ่อย อยากหวานง่าย และทำให้แรงซ้อมตก",
    };
  }

  if (dailyLog.water < goals.waterGoal) {
    return {
      title: "Water is too low",
      detail:
        "น้ำยังต่ำกว่าเป้า ก่อนจะตัดสินว่าหิวจริงหรืออยากกินเล่น ควรดันน้ำให้ถึงเป้าก่อน",
    };
  }

  if (totalProtein < goals.proteinGoal * 0.65) {
    return {
      title: "Protein is too low",
      detail:
        "โปรตีนยังต่ำ ถ้าลดน้ำหนักโดยโปรตีนไม่ถึง เสี่ยงเสียกล้ามและหิวง่ายกว่าเดิม",
    };
  }

  if (workoutMinutes === 0) {
    return {
      title: "No movement yet",
      detail:
        "วันนี้ยังไม่มี movement เลย ไม่ต้องซ้อมหนักก็ได้ แต่ควรมีอย่างน้อยเดินหรือ home workout สั้น ๆ",
    };
  }

  if (sweetDrinkCount > 0 || junkCount > 0) {
    return {
      title: "Food quality risk",
      detail:
        "วันนี้มีน้ำหวานหรือ junk แล้ว จุดสำคัญคืออย่าปล่อยให้มื้อต่อไปหลุดต่อเป็น chain",
    };
  }

  return {
    title: "System is stable",
    detail:
      "วันนี้ภาพรวมดี ไม่มีปัญหาหลักชัด ๆ ให้ทำต่อแบบนิ่ง ๆ และอย่าเติม snack แบบไม่จำเป็น",
  };
}

function getStrategy({
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
  const proteinLeft = Math.max(goals.proteinGoal - totalProtein, 0);

  if (!dailyLog) {
    return "เริ่มจากไปหน้า Dashboard แล้วบันทึก Daily Check-in ก่อน จากนั้นกลับมาดู Coach ใหม่";
  }

  if (dailyLog.sleep < goals.sleepGoal - 1) {
    return "วันนี้ใช้ strategy แบบ recovery cut: โปรตีนให้ถึง น้ำให้ถึง workout เบา ๆ และห้ามอดจนหิวหนักตอนดึก";
  }

  if (dailyLog.water < goals.waterGoal) {
    return `ดื่มน้ำเพิ่มให้ถึง ${goals.waterGoal}L ก่อน แล้วค่อยประเมินความหิวอีกที`;
  }

  if (proteinLeft > 0) {
    return `เติมโปรตีนอีกประมาณ ${Math.round(
      proteinLeft
    )}g ด้วยของง่าย เช่น whey, ไก่, ไข่, ทูน่า, หมูไม่ติดมัน`;
  }

  if (workoutMinutes === 0) {
    return "เลือก movement ที่ friction ต่ำที่สุด: เดิน 30 นาที หรือ home workout 15 นาที ไม่ต้องรอ mood";
  }

  if (sweetDrinkCount > 0 || junkCount > 0) {
    return "มื้อต่อไปให้เป็น reset meal: โปรตีนสูง น้ำเปล่า/zero และไม่ต้องกินชดเชยแบบอดข้าว";
  }

  return "ทำแบบเดิมต่อ ไม่ต้องเพิ่มความโหด แค่ปิดวันให้สะอาดและนอนให้ถึงเป้า";
}

function getAvoidList({
  dailyLog,
  totalProtein,
  sweetDrinkCount,
  junkCount,
  goals,
}: {
  dailyLog?: DailyLog;
  totalProtein: number;
  sweetDrinkCount: number;
  junkCount: number;
  goals: Goals;
}) {
  const avoid = [];

  if (!dailyLog) {
    avoid.push("อย่าเดาสุ่มว่าพังหรือดี จนกว่าจะ log baseline");
  }

  if (dailyLog && dailyLog.sleep < goals.sleepGoal - 1) {
    avoid.push("อย่าซ้อมหนักเพื่อชดเชยนอนน้อย");
    avoid.push("อย่าปล่อยให้หิวจัดตอนดึก");
  }

  if (dailyLog && dailyLog.water < goals.waterGoal) {
    avoid.push("อย่ากินขนมเพราะคิดว่าหิว ทั้งที่น้ำยังไม่ถึง");
  }

  if (totalProtein < goals.proteinGoal) {
    avoid.push("อย่าใช้มื้อคาร์บล้วนเป็นมื้อหลัก");
  }

  if (sweetDrinkCount > 0) {
    avoid.push("อย่าเติมน้ำหวานแก้วที่สอง");
  }

  if (junkCount > 0) {
    avoid.push("อย่าคิดว่าเพราะหลุดแล้ววันนี้พังหมด");
  }

  if (avoid.length === 0) {
    avoid.push("อย่าเพิ่ม snack แบบไม่ได้หิวจริง");
    avoid.push("อย่านอนดึกเพราะวันนี้ทำดีแล้ว");
  }

  return avoid.slice(0, 4);
}

function getTomorrowAdjustment({
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
  if (!dailyLog) {
    return "พรุ่งนี้ให้เริ่มวันด้วย Daily Check-in เพื่อให้ระบบมีข้อมูลตั้งแต่เช้า";
  }

  if (dailyLog.sleep < goals.sleepGoal - 1) {
    return "พรุ่งนี้อย่าเพิ่ม workout หนัก ให้แก้ที่เวลานอนก่อน";
  }

  if (totalProtein < goals.proteinGoal * 0.65) {
    return "พรุ่งนี้วางโปรตีนตั้งแต่มื้อแรก อย่ารอให้ถึงเย็นแล้วค่อยไล่โปรตีน";
  }

  if (workoutMinutes === 0) {
    return "พรุ่งนี้ล็อก movement ไว้ก่อน เช่น เดินหลังอาหาร หรือ home workout ก่อนอาบน้ำ";
  }

  return "พรุ่งนี้ทำ pattern เดิมซ้ำ: protein first, water early, movement ไม่ต้องรอ motivation";
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

  const mainProblem = getMainProblem({
    dailyLog,
    totalProtein,
    workoutMinutes,
    sweetDrinkCount,
    junkCount,
    goals,
  });

  const strategy = getStrategy({
    dailyLog,
    totalProtein,
    workoutMinutes,
    sweetDrinkCount,
    junkCount,
    goals,
  });

  const avoidList = getAvoidList({
    dailyLog,
    totalProtein,
    sweetDrinkCount,
    junkCount,
    goals,
  });

  const tomorrowAdjustment = getTomorrowAdjustment({
    dailyLog,
    totalProtein,
    workoutMinutes,
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
              Read the system.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Coach / v2.0
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

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <p className="text-sm text-zinc-400">System Score</p>

            <p className="mt-3 text-7xl font-black tracking-tight md:text-8xl">
              {overallScore}
              <span className="ml-2 text-3xl text-zinc-500">/100</span>
            </p>

            <p className="mt-4 text-sm font-bold text-emerald-300">
              {getRiskLevel(overallScore)}
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${overallScore}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3">
              <ScoreRow label="Baseline" value={baselineScore} />
              <ScoreRow label="Protein" value={proteinScore} />
              <ScoreRow label="Workout" value={workoutScore} />
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 md:p-6">
            <p className="text-sm text-emerald-300">Main Problem</p>
            <h2 className="mt-1 text-3xl font-black">{mainProblem.title}</h2>

            <p className="mt-4 text-sm leading-6 text-zinc-200">
              {mainProblem.detail}
            </p>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
                Recommended Strategy
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-200">{strategy}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <InsightCard
            title="What to avoid"
            subtitle="กันไม่ให้วันหลุดไหลยาว"
          >
            <div className="grid gap-3">
              {avoidList.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </InsightCard>

          <InsightCard title="Tomorrow adjustment" subtitle="ปรับพรุ่งนี้ให้ดีขึ้น">
            <p className="rounded-2xl bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">
              {tomorrowAdjustment}
            </p>
          </InsightCard>

          <InsightCard title="Current numbers" subtitle="อ่านสถานะวันนี้">
            <div className="grid gap-3">
              <NumberRow
                label="Weight"
                value={dailyLog && dailyLog.weight ? `${dailyLog.weight} kg` : "-"}
              />
              <NumberRow
                label="Protein"
                value={`${totalProtein}g / ${goals.proteinGoal}g`}
              />
              <NumberRow
                label="Protein Left"
                value={`${Math.round(proteinLeft)}g`}
              />
              <NumberRow
                label="Water"
                value={
                  dailyLog
                    ? `${dailyLog.water}L / ${goals.waterGoal}L`
                    : `- / ${goals.waterGoal}L`
                }
              />
              <NumberRow label="Workout" value={`${workoutMinutes} min`} />
            </div>
          </InsightCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <DetailPanel title="Food signals">
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

          <DetailPanel title="Workout signals">
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

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">{label}</span>
        <span className="font-bold text-zinc-300">{value}/100</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function InsightCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <p className="text-sm text-zinc-400">{subtitle}</p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function NumberRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-950 p-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-bold text-zinc-200">{value}</span>
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
      <p className="text-sm text-zinc-400">Signals</p>
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