"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../AppNav";
import DateMenu from "../DateMenu";

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

  playType?: BadmintonPlayType;
  gamesPlayed?: number;

  pushupSets?: number;
  pushupReps?: number;

  squatSets?: number;
  squatReps?: number;

  plankSets?: number;
  plankMinutes?: number;

  sidePlankLeftSets?: number;
  sidePlankLeftMinutes?: number;

  sidePlankRightSets?: number;
  sidePlankRightMinutes?: number;

  supermanSets?: number;
  supermanReps?: number;

  lungeSets?: number;
  lungeReps?: number;

  leftLungeSets?: number;
  leftLungeReps?: number;

  rightLungeSets?: number;
  rightLungeReps?: number;

  mountainClimberSets?: number;
  mountainClimberReps?: number;

  steps?: number;
  distanceKm?: number;

  swimmingMeters?: number;
  swimmingLaps?: number;

  otherName?: string;
  notes: string;
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getLocalDateString();

function createDefaultForm(date: string): WorkoutLog {
  return {
    id: crypto.randomUUID(),
    date,
    type: "badminton",
    durationMinutes: 180,
    playType: "match",
    gamesPlayed: 0,

    pushupSets: 3,
    pushupReps: 10,

    squatSets: 3,
    squatReps: 15,

    plankSets: 3,
    plankMinutes: 0.5,

    sidePlankLeftSets: 0,
    sidePlankLeftMinutes: 0,

    sidePlankRightSets: 0,
    sidePlankRightMinutes: 0,

    supermanSets: 0,
    supermanReps: 0,

    lungeSets: 0,
    lungeReps: 0,

    leftLungeSets: 0,
    leftLungeReps: 0,

    rightLungeSets: 0,
    rightLungeReps: 0,

    mountainClimberSets: 0,
    mountainClimberReps: 0,

    steps: 0,
    distanceKm: 0,
    swimmingMeters: 0,
    swimmingLaps: 0,
    otherName: "",
    notes: "",
  };
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

function getPlayTypeLabel(type?: BadmintonPlayType) {
  if (type === "casual") return "ตีเล่น";
  if (type === "practice") return "ซ้อม";
  if (type === "match") return "เล่นเกมจริง";
  return "-";
}

function getDefaultDuration(type: WorkoutType) {
  if (type === "badminton") return 180;
  if (type === "home-workout") return 20;
  if (type === "walking") return 30;
  if (type === "running") return 30;
  if (type === "swimming") return 30;
  if (type === "stretching") return 15;
  return 30;
}

function getDurationScore(type: WorkoutType, minutes: number) {
  if (type === "badminton") {
    if (minutes >= 180) return 100;
    if (minutes >= 120) return 85;
    if (minutes >= 60) return 65;
    if (minutes >= 30) return 40;
    return 20;
  }

  if (type === "home-workout") {
    if (minutes >= 30) return 100;
    if (minutes >= 20) return 80;
    if (minutes >= 15) return 60;
    if (minutes >= 10) return 40;
    return 20;
  }

  if (type === "walking") {
    if (minutes >= 60) return 100;
    if (minutes >= 45) return 85;
    if (minutes >= 30) return 70;
    if (minutes >= 15) return 45;
    return 20;
  }

  if (type === "running") {
    if (minutes >= 45) return 100;
    if (minutes >= 30) return 80;
    if (minutes >= 20) return 60;
    if (minutes >= 10) return 35;
    return 20;
  }

  if (type === "swimming") {
    if (minutes >= 45) return 100;
    if (minutes >= 30) return 80;
    if (minutes >= 20) return 60;
    if (minutes >= 10) return 35;
    return 20;
  }

  if (type === "stretching") {
    if (minutes >= 20) return 100;
    if (minutes >= 15) return 80;
    if (minutes >= 10) return 60;
    return 30;
  }

  if (minutes >= 45) return 100;
  if (minutes >= 30) return 80;
  if (minutes >= 15) return 55;
  return 25;
}

function getExerciseTotal(sets?: number, reps?: number) {
  return Number(sets ?? 0) * Number(reps ?? 0);
}

function getPlankTotalMinutes(sets?: number, minutes?: number) {
  return Number(sets ?? 0) * Number(minutes ?? 0);
}

function getAllPlankMinutes(log: WorkoutLog) {
  return (
    getPlankTotalMinutes(log.plankSets, log.plankMinutes) +
    getPlankTotalMinutes(log.sidePlankLeftSets, log.sidePlankLeftMinutes) +
    getPlankTotalMinutes(log.sidePlankRightSets, log.sidePlankRightMinutes)
  );
}

function getAllLunges(log: WorkoutLog) {
  return (
    getExerciseTotal(log.lungeSets, log.lungeReps) +
    getExerciseTotal(log.leftLungeSets, log.leftLungeReps) +
    getExerciseTotal(log.rightLungeSets, log.rightLungeReps)
  );
}

function getHomeWorkoutVolume(log: WorkoutLog) {
  const pushups = getExerciseTotal(log.pushupSets, log.pushupReps);
  const squats = getExerciseTotal(log.squatSets, log.squatReps);
  const superman = getExerciseTotal(log.supermanSets, log.supermanReps);
  const lunges = getAllLunges(log);
  const mountainClimbers = getExerciseTotal(
    log.mountainClimberSets,
    log.mountainClimberReps
  );
  const plankMinutes = getAllPlankMinutes(log);

  return (
    pushups +
    squats +
    superman +
    lunges +
    Math.floor(mountainClimbers / 2) +
    plankMinutes * 10
  );
}

function getWorkoutScore(log: WorkoutLog) {
  const durationScore = getDurationScore(log.type, log.durationMinutes);

  if (log.type === "badminton") {
    const gameBonus = Math.min((log.gamesPlayed ?? 0) * 3, 15);
    const playBonus =
      log.playType === "match" ? 15 : log.playType === "practice" ? 8 : 0;

    return Math.min(100, Math.round(durationScore * 0.75 + gameBonus + playBonus));
  }

  if (log.type === "home-workout") {
    const volume = getHomeWorkoutVolume(log);

    const strengthScore =
      volume >= 180
        ? 100
        : volume >= 120
        ? 85
        : volume >= 75
        ? 70
        : volume >= 40
        ? 50
        : volume > 0
        ? 30
        : 0;

    return Math.round(strengthScore * 0.7 + durationScore * 0.3);
  }

  if (log.type === "walking") {
    const steps = log.steps ?? 0;

    const stepScore =
      steps >= 10000
        ? 100
        : steps >= 8000
        ? 85
        : steps >= 5000
        ? 65
        : steps >= 3000
        ? 45
        : steps > 0
        ? 25
        : 0;

    return steps > 0
      ? Math.round(stepScore * 0.65 + durationScore * 0.35)
      : durationScore;
  }

  if (log.type === "running") {
    const distance = log.distanceKm ?? 0;

    const distanceScore =
      distance >= 8
        ? 100
        : distance >= 5
        ? 85
        : distance >= 3
        ? 65
        : distance >= 1.5
        ? 45
        : distance > 0
        ? 25
        : 0;

    return distance > 0
      ? Math.round(distanceScore * 0.7 + durationScore * 0.3)
      : durationScore;
  }

  if (log.type === "swimming") {
    const meters = log.swimmingMeters ?? 0;
    const laps = log.swimmingLaps ?? 0;

    const meterScore =
      meters >= 1500
        ? 100
        : meters >= 1000
        ? 85
        : meters >= 500
        ? 65
        : meters >= 200
        ? 45
        : meters > 0
        ? 25
        : 0;

    const lapScore =
      laps >= 40
        ? 100
        : laps >= 25
        ? 80
        : laps >= 15
        ? 60
        : laps >= 5
        ? 35
        : laps > 0
        ? 20
        : 0;

    if (meters > 0) return Math.round(meterScore * 0.75 + durationScore * 0.25);
    if (laps > 0) return Math.round(lapScore * 0.7 + durationScore * 0.3);

    return durationScore;
  }

  return durationScore;
}

function getCoachMessage(logs: WorkoutLog[]) {
  if (logs.length === 0) {
    return "วันนี้ยังไม่มี workout log ถ้าไม่ได้ตีแบด ให้ทำ Home Workout 15–20 นาทีพอ: push-up, squat, plank";
  }

  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const hasBadminton = logs.some((log) => log.type === "badminton");
  const hasHomeWorkout = logs.some((log) => log.type === "home-workout");
  const hasWalking = logs.some((log) => log.type === "walking");
  const hasRunning = logs.some((log) => log.type === "running");
  const hasSwimming = logs.some((log) => log.type === "swimming");

  if (hasBadminton && totalMinutes >= 180) {
    return "วันนี้ตีแบดเยอะมาก พอแล้ว ไม่ต้องเพิ่มคาร์ดิโออีก โฟกัสน้ำ โปรตีน และนอนให้พอ";
  }

  if ((hasBadminton || hasRunning || hasSwimming) && !hasHomeWorkout) {
    return "วันนี้คาร์ดิโอดีแล้ว แต่ถ้าอยากลดแล้วหุ่นชัดขึ้น เพิ่ม Home Workout สั้น ๆ 2–3 วันต่อสัปดาห์จะช่วยรักษากล้าม";
  }

  if (hasHomeWorkout) {
    return "ดีมาก วันนี้มีแรงต้านแล้ว นี่คือส่วนสำคัญที่จะทำให้ลดน้ำหนักแล้วไม่โทรม";
  }

  if (hasWalking) {
    return "วันนี้มี Walking แล้ว ดีมากสำหรับวันเบา ๆ ช่วยเผาผลาญโดยไม่ล้าหนัก";
  }

  return "วันนี้ขยับแล้ว ถือว่าดี เป้าหมายคือความสม่ำเสมอ ไม่ใช่ทำหนักจนพัง";
}

function getWorkoutDetail(log: WorkoutLog) {
  if (log.type === "badminton") {
    return `${getPlayTypeLabel(log.playType)} / ${log.gamesPlayed ?? 0} games`;
  }

  if (log.type === "home-workout") {
    const pushups = getExerciseTotal(log.pushupSets, log.pushupReps);
    const squats = getExerciseTotal(log.squatSets, log.squatReps);
    const plank = getPlankTotalMinutes(log.plankSets, log.plankMinutes);
    const sideLeft = getPlankTotalMinutes(
      log.sidePlankLeftSets,
      log.sidePlankLeftMinutes
    );
    const sideRight = getPlankTotalMinutes(
      log.sidePlankRightSets,
      log.sidePlankRightMinutes
    );
    const superman = getExerciseTotal(log.supermanSets, log.supermanReps);
    const lunges = getExerciseTotal(log.lungeSets, log.lungeReps);
    const leftLunges = getExerciseTotal(log.leftLungeSets, log.leftLungeReps);
    const rightLunges = getExerciseTotal(log.rightLungeSets, log.rightLungeReps);
    const mountainClimbers = getExerciseTotal(
      log.mountainClimberSets,
      log.mountainClimberReps
    );

    return `PU ${pushups} / SQ ${squats} / Plank ${plank.toFixed(
      1
    )}m / Side L ${sideLeft.toFixed(1)}m / Side R ${sideRight.toFixed(
      1
    )}m / Superman ${superman} / Lunges ${lunges} / L ${leftLunges} / R ${rightLunges} / MC ${mountainClimbers}`;
  }

  if (log.type === "walking") {
    return `${log.steps ?? 0} steps`;
  }

  if (log.type === "running") {
    return `${log.distanceKm ?? 0} km / ${log.steps ?? 0} steps`;
  }

  if (log.type === "swimming") {
    return `${log.swimmingMeters ?? 0} m / ${log.swimmingLaps ?? 0} laps`;
  }

  if (log.type === "stretching") {
    return "Stretching only";
  }

  return log.otherName ? log.otherName : "Other activity";
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

function normalizeWorkoutLog(raw: Record<string, unknown>): WorkoutLog {
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    date: typeof raw.date === "string" ? raw.date : today,
    type: normalizeWorkoutType(raw.type),
    durationMinutes:
      typeof raw.durationMinutes === "number" ? raw.durationMinutes : 0,

    playType:
      raw.playType === "casual" || raw.playType === "practice" || raw.playType === "match"
        ? raw.playType
        : undefined,
    gamesPlayed: typeof raw.gamesPlayed === "number" ? raw.gamesPlayed : 0,

    pushupSets: typeof raw.pushupSets === "number" ? raw.pushupSets : 0,
    pushupReps: typeof raw.pushupReps === "number" ? raw.pushupReps : 0,

    squatSets: typeof raw.squatSets === "number" ? raw.squatSets : 0,
    squatReps: typeof raw.squatReps === "number" ? raw.squatReps : 0,

    plankSets: typeof raw.plankSets === "number" ? raw.plankSets : 0,
    plankMinutes: typeof raw.plankMinutes === "number" ? raw.plankMinutes : 0,

    sidePlankLeftSets:
      typeof raw.sidePlankLeftSets === "number" ? raw.sidePlankLeftSets : 0,
    sidePlankLeftMinutes:
      typeof raw.sidePlankLeftMinutes === "number" ? raw.sidePlankLeftMinutes : 0,

    sidePlankRightSets:
      typeof raw.sidePlankRightSets === "number" ? raw.sidePlankRightSets : 0,
    sidePlankRightMinutes:
      typeof raw.sidePlankRightMinutes === "number" ? raw.sidePlankRightMinutes : 0,

    supermanSets: typeof raw.supermanSets === "number" ? raw.supermanSets : 0,
    supermanReps: typeof raw.supermanReps === "number" ? raw.supermanReps : 0,

    lungeSets: typeof raw.lungeSets === "number" ? raw.lungeSets : 0,
    lungeReps: typeof raw.lungeReps === "number" ? raw.lungeReps : 0,

    leftLungeSets: typeof raw.leftLungeSets === "number" ? raw.leftLungeSets : 0,
    leftLungeReps: typeof raw.leftLungeReps === "number" ? raw.leftLungeReps : 0,

    rightLungeSets:
      typeof raw.rightLungeSets === "number" ? raw.rightLungeSets : 0,
    rightLungeReps:
      typeof raw.rightLungeReps === "number" ? raw.rightLungeReps : 0,

    mountainClimberSets:
      typeof raw.mountainClimberSets === "number" ? raw.mountainClimberSets : 0,
    mountainClimberReps:
      typeof raw.mountainClimberReps === "number" ? raw.mountainClimberReps : 0,

    steps: typeof raw.steps === "number" ? raw.steps : 0,
    distanceKm: typeof raw.distanceKm === "number" ? raw.distanceKm : 0,
    swimmingMeters:
      typeof raw.swimmingMeters === "number" ? raw.swimmingMeters : 0,
    swimmingLaps: typeof raw.swimmingLaps === "number" ? raw.swimmingLaps : 0,
    otherName: typeof raw.otherName === "string" ? raw.otherName : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

export default function WorkoutPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<WorkoutLog>(() => createDefaultForm(today));

  useEffect(() => {
    const saved = localStorage.getItem("operation-recode-workout-logs");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setLogs(parsed.map((item) => normalizeWorkoutLog(item)));
      }
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("operation-recode-workout-logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      date: selectedDate,
    }));
  }, [selectedDate]);

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

  const totalMinutes = selectedLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalGames = selectedLogs.reduce((sum, log) => sum + (log.gamesPlayed ?? 0), 0);
  const totalSteps = selectedLogs.reduce((sum, log) => sum + (log.steps ?? 0), 0);
  const totalDistance = selectedLogs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
  const totalSwimMeters = selectedLogs.reduce(
    (sum, log) => sum + (log.swimmingMeters ?? 0),
    0
  );

  const totalPushups = selectedLogs.reduce(
    (sum, log) => sum + getExerciseTotal(log.pushupSets, log.pushupReps),
    0
  );

  const totalSquats = selectedLogs.reduce(
    (sum, log) => sum + getExerciseTotal(log.squatSets, log.squatReps),
    0
  );

  const totalLunges = selectedLogs.reduce((sum, log) => sum + getAllLunges(log), 0);

  const totalPlankMinutes = selectedLogs.reduce(
    (sum, log) => sum + getAllPlankMinutes(log),
    0
  );

  const averageScore =
    selectedLogs.length > 0
      ? Math.round(
          selectedLogs.reduce((sum, log) => sum + getWorkoutScore(log), 0) /
            selectedLogs.length
        )
      : 0;

  function handleTypeChange(nextType: WorkoutType) {
    setForm({
      ...form,
      type: nextType,
      durationMinutes: getDefaultDuration(nextType),
      playType: nextType === "badminton" ? "match" : undefined,
      gamesPlayed: nextType === "badminton" ? form.gamesPlayed ?? 0 : 0,
      steps:
        nextType === "walking" || nextType === "running" ? form.steps ?? 0 : 0,
      distanceKm: nextType === "running" ? form.distanceKm ?? 0 : 0,
      swimmingMeters: nextType === "swimming" ? form.swimmingMeters ?? 0 : 0,
      swimmingLaps: nextType === "swimming" ? form.swimmingLaps ?? 0 : 0,
      otherName: nextType === "other" ? form.otherName ?? "" : "",
    });
  }

  function saveWorkout() {
    if (form.type === "other" && !form.otherName?.trim()) {
      alert("ระบุด้วยว่า Other คืออะไร");
      return;
    }

    const isHome = form.type === "home-workout";

    const newLog: WorkoutLog = {
      ...form,
      id: crypto.randomUUID(),
      date: selectedDate,
      durationMinutes: Number(form.durationMinutes),

      gamesPlayed: form.type === "badminton" ? Number(form.gamesPlayed ?? 0) : 0,

      pushupSets: isHome ? Number(form.pushupSets ?? 0) : 0,
      pushupReps: isHome ? Number(form.pushupReps ?? 0) : 0,

      squatSets: isHome ? Number(form.squatSets ?? 0) : 0,
      squatReps: isHome ? Number(form.squatReps ?? 0) : 0,

      plankSets: isHome ? Number(form.plankSets ?? 0) : 0,
      plankMinutes: isHome ? Number(form.plankMinutes ?? 0) : 0,

      sidePlankLeftSets: isHome ? Number(form.sidePlankLeftSets ?? 0) : 0,
      sidePlankLeftMinutes: isHome ? Number(form.sidePlankLeftMinutes ?? 0) : 0,

      sidePlankRightSets: isHome ? Number(form.sidePlankRightSets ?? 0) : 0,
      sidePlankRightMinutes: isHome ? Number(form.sidePlankRightMinutes ?? 0) : 0,

      supermanSets: isHome ? Number(form.supermanSets ?? 0) : 0,
      supermanReps: isHome ? Number(form.supermanReps ?? 0) : 0,

      lungeSets: isHome ? Number(form.lungeSets ?? 0) : 0,
      lungeReps: isHome ? Number(form.lungeReps ?? 0) : 0,

      leftLungeSets: isHome ? Number(form.leftLungeSets ?? 0) : 0,
      leftLungeReps: isHome ? Number(form.leftLungeReps ?? 0) : 0,

      rightLungeSets: isHome ? Number(form.rightLungeSets ?? 0) : 0,
      rightLungeReps: isHome ? Number(form.rightLungeReps ?? 0) : 0,

      mountainClimberSets: isHome ? Number(form.mountainClimberSets ?? 0) : 0,
      mountainClimberReps: isHome ? Number(form.mountainClimberReps ?? 0) : 0,

      steps:
        form.type === "walking" || form.type === "running"
          ? Number(form.steps ?? 0)
          : 0,

      distanceKm: form.type === "running" ? Number(form.distanceKm ?? 0) : 0,

      swimmingMeters:
        form.type === "swimming" ? Number(form.swimmingMeters ?? 0) : 0,
      swimmingLaps:
        form.type === "swimming" ? Number(form.swimmingLaps ?? 0) : 0,

      otherName: form.type === "other" ? form.otherName?.trim() : "",
    };

    setLogs((current) => [...current, newLog]);
    setForm((current) => ({ ...current, id: crypto.randomUUID(), notes: "" }));
  }

  function deleteWorkout(id: string) {
    setLogs((current) => current.filter((log) => log.id !== id));
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
              Log training only.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Training / v0.12
          </div>
        </nav>

        <DateMenu
          selectedDate={selectedDate}
          availableDates={availableDates}
          today={today}
          onChange={setSelectedDate}
        />

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Workout Check-in</p>
            <h2 className="mt-1 text-2xl font-bold">Log training</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs text-zinc-500">Workout Type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    handleTypeChange(event.target.value as WorkoutType)
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
                      value={form.playType ?? "match"}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          playType: event.target.value as BadmintonPlayType,
                        })
                      }
                      className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                    >
                      <option value="casual">ตีเล่น</option>
                      <option value="practice">ซ้อม</option>
                      <option value="match">เล่นเกมจริง</option>
                    </select>
                  </label>

                  <Input
                    label="Games played"
                    type="number"
                    value={String(form.gamesPlayed ?? 0)}
                    onChange={(value) =>
                      setForm({ ...form, gamesPlayed: Number(value) })
                    }
                  />
                </>
              )}

              {form.type === "home-workout" && (
                <>
                  <div className="md:col-span-2 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
                    <p className="font-bold text-zinc-200">Recommended Home Workout</p>
                    <p className="mt-2">
                      Core: Push-ups, Squats, Plank. Optional: Side Plank,
                      Superman, Lunges, Mountain Climbers.
                    </p>
                  </div>

                  <ExerciseSetReps
                    title="Push-ups"
                    unit="reps"
                    sets={form.pushupSets ?? 0}
                    reps={form.pushupReps ?? 0}
                    onSetsChange={(value) =>
                      setForm({ ...form, pushupSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, pushupReps: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Squats"
                    unit="reps"
                    sets={form.squatSets ?? 0}
                    reps={form.squatReps ?? 0}
                    onSetsChange={(value) =>
                      setForm({ ...form, squatSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, squatReps: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Plank"
                    unit="min / set"
                    sets={form.plankSets ?? 0}
                    reps={form.plankMinutes ?? 0}
                    step="0.1"
                    onSetsChange={(value) =>
                      setForm({ ...form, plankSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, plankMinutes: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Side Plank Left"
                    unit="min / set"
                    sets={form.sidePlankLeftSets ?? 0}
                    reps={form.sidePlankLeftMinutes ?? 0}
                    step="0.1"
                    onSetsChange={(value) =>
                      setForm({ ...form, sidePlankLeftSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, sidePlankLeftMinutes: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Side Plank Right"
                    unit="min / set"
                    sets={form.sidePlankRightSets ?? 0}
                    reps={form.sidePlankRightMinutes ?? 0}
                    step="0.1"
                    onSetsChange={(value) =>
                      setForm({ ...form, sidePlankRightSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, sidePlankRightMinutes: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Superman"
                    unit="reps"
                    sets={form.supermanSets ?? 0}
                    reps={form.supermanReps ?? 0}
                    onSetsChange={(value) =>
                      setForm({ ...form, supermanSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, supermanReps: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Lunges"
                    unit="reps"
                    sets={form.lungeSets ?? 0}
                    reps={form.lungeReps ?? 0}
                    onSetsChange={(value) =>
                      setForm({ ...form, lungeSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, lungeReps: Number(value) })
                    }
                  />

                  <ExerciseSetReps
                    title="Mountain Climbers"
                    unit="reps"
                    sets={form.mountainClimberSets ?? 0}
                    reps={form.mountainClimberReps ?? 0}
                    onSetsChange={(value) =>
                      setForm({ ...form, mountainClimberSets: Number(value) })
                    }
                    onRepsChange={(value) =>
                      setForm({ ...form, mountainClimberReps: Number(value) })
                    }
                  />
                </>
              )}

              {form.type === "walking" && (
                <Input
                  label="Steps"
                  type="number"
                  value={String(form.steps ?? 0)}
                  onChange={(value) => setForm({ ...form, steps: Number(value) })}
                />
              )}

              {form.type === "running" && (
                <>
                  <Input
                    label="Distance (km)"
                    type="number"
                    value={String(form.distanceKm ?? 0)}
                    onChange={(value) =>
                      setForm({ ...form, distanceKm: Number(value) })
                    }
                  />

                  <Input
                    label="Steps"
                    type="number"
                    value={String(form.steps ?? 0)}
                    onChange={(value) => setForm({ ...form, steps: Number(value) })}
                  />
                </>
              )}

              {form.type === "swimming" && (
                <>
                  <Input
                    label="Distance (meters)"
                    type="number"
                    value={String(form.swimmingMeters ?? 0)}
                    onChange={(value) =>
                      setForm({ ...form, swimmingMeters: Number(value) })
                    }
                  />

                  <Input
                    label="Laps"
                    type="number"
                    value={String(form.swimmingLaps ?? 0)}
                    onChange={(value) =>
                      setForm({ ...form, swimmingLaps: Number(value) })
                    }
                  />
                </>
              )}

              {form.type === "other" && (
                <Input
                  label="Other activity name"
                  type="text"
                  value={form.otherName ?? ""}
                  onChange={(value) => setForm({ ...form, otherName: value })}
                />
              )}
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-zinc-500">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="เช่น ตีแบด 3 ชม. / เดิน 30 นาที / plank ไหวไหม / เข่าโอเคไหม"
                className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <button
              onClick={saveWorkout}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
            >
              Save Workout
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Today Summary</p>
            <h2 className="mt-1 text-2xl font-bold">{selectedDate}</h2>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Training Score</p>
                  <p className="mt-2 text-5xl font-black">
                    {averageScore}
                    <span className="text-xl text-zinc-500"> / 100</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500">Minutes</p>
                  <p className="mt-2 text-4xl font-black">{totalMinutes}</p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${averageScore}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SmallStat label="Logs" value={String(selectedLogs.length)} />
              <SmallStat label="Games" value={String(totalGames)} />
              <SmallStat label="Steps" value={String(totalSteps)} />
              <SmallStat label="Run" value={`${totalDistance.toFixed(1)} km`} />
              <SmallStat label="Swim" value={`${totalSwimMeters} m`} />
              <SmallStat
                label="Strength"
                value={`${totalPushups}/${totalSquats}/${totalLunges}/${totalPlankMinutes.toFixed(
                  1
                )}m`}
              />
            </div>

            <div className="mt-4 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Training Coach Lite</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {getCoachMessage(selectedLogs)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <p className="text-sm text-zinc-400">Workout History</p>
          <h3 className="mt-1 text-2xl font-bold">Training logs</h3>

          <div className="mt-5 grid gap-3">
            {selectedLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-500">
                ยังไม่มี workout log วันนี้
              </div>
            ) : (
              selectedLogs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-bold">
                        {log.type === "other" && log.otherName
                          ? log.otherName
                          : getWorkoutLabel(log.type)}
                      </p>
                      <p className="text-zinc-500">
                        Score {getWorkoutScore(log)}/100
                      </p>
                    </div>

                    <p>{log.durationMinutes} min</p>
                    <p className="break-words text-zinc-400">{getWorkoutDetail(log)}</p>
                    <p className="text-zinc-500">{log.notes || "-"}</p>

                    <button
                      onClick={() => deleteWorkout(log.id)}
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

function ExerciseSetReps({
  title,
  unit,
  sets,
  reps,
  step = "1",
  onSetsChange,
  onRepsChange,
}: {
  title: string;
  unit: string;
  sets: number;
  reps: number;
  step?: string;
  onSetsChange: (value: string) => void;
  onRepsChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-zinc-500">
          Total: {(Number(sets) * Number(reps)).toFixed(
            unit.includes("min") ? 1 : 0
          )}{" "}
          {unit.includes("min") ? "min" : "reps"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Sets" type="number" value={String(sets)} onChange={onSetsChange} />

        <Input
          label={unit.includes("min") ? "Minutes / set" : "Reps / set"}
          type="number"
          value={String(reps)}
          step={step}
          onChange={onRepsChange}
        />
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-black leading-tight">{value}</p>
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