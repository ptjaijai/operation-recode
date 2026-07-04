"use client";

import { useEffect, useMemo, useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "post-workout";

type FoodLog = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  protein: number;
  hasSweetDrink: boolean;
  isJunkFood: boolean;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const PROTEIN_GOAL = 120;

function getMealLabel(type: MealType) {
  if (type === "breakfast") return "Breakfast";
  if (type === "lunch") return "Lunch";
  if (type === "dinner") return "Dinner";
  if (type === "snack") return "Snack";
  return "Post-workout";
}

function getCoachMessage(totalProtein: number, sweetDrinks: number, junkFoods: number) {
  if (totalProtein < 70) {
    return "โปรตีนวันนี้ยังน้อยไปมาก พรุ่งนี้เพิ่มเวย์ ไข่ หรือเนื้อสัตว์อีก 1–2 มื้อก่อนคิดเรื่องลดแคลหนัก ๆ";
  }

  if (totalProtein < PROTEIN_GOAL) {
    return "โปรตีนยังไม่ถึงเป้า แต่ถือว่าเริ่มดีแล้ว วันนี้ขาดอีกไม่เยอะ เติมเวย์หรือเนื้อสัตว์อีกนิดจะดีมาก";
  }

  if (sweetDrinks > 0 && junkFoods > 0) {
    return "โปรตีนถึงแล้ว ดีมาก แต่วันนี้มีทั้งน้ำหวานและของจุกจิก พรุ่งนี้เลือกตัดอย่างใดอย่างหนึ่งก่อน ไม่ต้องตัดหมด";
  }

  if (sweetDrinks > 0) {
    return "โปรตีนดีแล้ว จุดที่ควรคุมคือเครื่องดื่มหวาน เพราะแคลอรี่แฝงสูงและไม่ค่อยอิ่ม";
  }

  if (junkFoods > 1) {
    return "วันนี้ของจุกจิกค่อนข้างเยอะ พรุ่งนี้ลดปริมาณลงครึ่งหนึ่งพอ ไม่ต้องหักดิบ";
  }

  return "วันนี้อาหารดีมาก โปรตีนโอเค ของจุกจิกคุมได้ รักษาแบบนี้ต่อเนื่องคือทางไป 60kg แบบไม่โทรม";
}

export default function FoodPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FoodLog>({
    id: crypto.randomUUID(),
    date: today,
    mealType: "lunch",
    foodName: "",
    protein: 25,
    hasSweetDrink: false,
    isJunkFood: false,
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("operation-recode-food-logs");

    if (saved) {
      setLogs(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("operation-recode-food-logs", JSON.stringify(logs));
  }, [logs]);

  const todayLogs = useMemo(() => {
    return logs.filter((log) => log.date === selectedDate);
  }, [logs, selectedDate]);

  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0);
  const sweetDrinks = todayLogs.filter((log) => log.hasSweetDrink).length;
  const junkFoods = todayLogs.filter((log) => log.isJunkFood).length;

  const proteinProgress = Math.min(100, (totalProtein / PROTEIN_GOAL) * 100);
  const coachMessage = getCoachMessage(totalProtein, sweetDrinks, junkFoods);

  function saveFood() {
    if (!form.foodName.trim()) {
      alert("ใส่ชื่ออาหารก่อน");
      return;
    }

    const newLog: FoodLog = {
      ...form,
      id: crypto.randomUUID(),
      date: selectedDate,
      protein: Number(form.protein),
    };

    setLogs((current) => [...current, newLog]);

    setForm((current) => ({
      ...current,
      id: crypto.randomUUID(),
      foodName: "",
      protein: 25,
      hasSweetDrink: false,
      isJunkFood: false,
      notes: "",
    }));
  }

  function deleteFood(id: string) {
    setLogs((current) => current.filter((log) => log.id !== id));
  }

  function clearFoodData() {
    const confirmed = window.confirm("Clear all food logs?");
    if (!confirmed) return;

    setLogs([]);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 md:px-8">
        <nav className="mb-8 flex items-center justify-between gap-4">
          <div>
            <a href="/" className="text-xs text-zinc-500 hover:text-emerald-400">
              ← Back to Dashboard
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-emerald-400">
              Operation: Recode
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-6xl">
              Food Tracker.
              <br />
              Protein first.
            </h1>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Nutrition / v0.4
          </div>
        </nav>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Food Check-in</p>
            <h2 className="mt-1 text-2xl font-bold">Log food</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(value) => {
                  setSelectedDate(value);
                  setForm({ ...form, date: value });
                }}
              />

              <label className="block">
                <span className="text-xs text-zinc-500">Meal</span>
                <select
                  value={form.mealType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mealType: event.target.value as MealType,
                    })
                  }
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="post-workout">Post-workout</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <Input
                  label="Food"
                  type="text"
                  value={form.foodName}
                  onChange={(value) => setForm({ ...form, foodName: value })}
                />
              </div>

              <Input
                label="Protein estimate (g)"
                type="number"
                value={String(form.protein)}
                onChange={(value) => setForm({ ...form, protein: Number(value) })}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-950 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasSweetDrink}
                  onChange={(event) =>
                    setForm({ ...form, hasSweetDrink: event.target.checked })
                  }
                  className="h-5 w-5 accent-emerald-400"
                />
                มีน้ำหวาน / ชานม / น้ำอัดลม
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-950 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={form.isJunkFood}
                  onChange={(event) =>
                    setForm({ ...form, isJunkFood: event.target.checked })
                  }
                  className="h-5 w-5 accent-emerald-400"
                />
                เป็นของจุกจิก / ขนม
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-zinc-500">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="เช่น หมูกระทะ / เวย์ Hooray / กะเพราหมู / กินดึก"
                className="mt-1 min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </label>

            <div className="mt-4 flex gap-3">
              <button
                onClick={saveFood}
                className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300"
              >
                Save Food
              </button>

              <button
                onClick={clearFoodData}
                className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
            <p className="text-sm text-zinc-400">Nutrition Dashboard</p>
            <h2 className="mt-1 text-2xl font-bold">{selectedDate}</h2>

            <div className="mt-6 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Protein Progress</p>
              <p className="mt-2 text-5xl font-black">
                {totalProtein}
                <span className="text-xl text-zinc-500"> / {PROTEIN_GOAL}g</span>
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                เป้าหมายโปรตีนต่อวัน: 120g โดยประมาณ
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <StatCard
                label="Food Logs"
                value={String(todayLogs.length)}
                note="Entries today"
              />
              <StatCard
                label="Sweet Drinks"
                value={String(sweetDrinks)}
                note="Aim: 0–1"
              />
              <StatCard
                label="Junk Food"
                value={String(junkFoods)}
                note="Control target"
              />
            </div>

            <div className="mt-5 rounded-3xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">Nutrition Coach Lite</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {coachMessage}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Food History</p>
              <h3 className="mt-1 text-2xl font-bold">Today&apos;s meals</h3>
            </div>

            <p className="text-sm text-zinc-500">{todayLogs.length} entries</p>
          </div>

          <div className="mt-5 grid gap-3">
            {todayLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-500">
                ยังไม่มี food log วันนี้
              </div>
            ) : (
              todayLogs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="grid gap-3 rounded-2xl bg-zinc-950 p-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-bold">{log.foodName}</p>
                      <p className="text-zinc-500">{getMealLabel(log.mealType)}</p>
                    </div>

                    <p>{log.protein}g protein</p>

                    <p className="text-zinc-400">
                      {log.hasSweetDrink ? "Sweet drink" : "No sweet drink"}
                    </p>

                    <p className="text-zinc-400">
                      {log.isJunkFood ? "Junk/snack" : "Normal food"}
                    </p>

                    <button
                      onClick={() => deleteFood(log.id)}
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

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
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