type DateMenuProps = {
  selectedDate: string;
  availableDates: string[];
  today: string;
  onChange: (date: string) => void;
};

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

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  return getLocalDateString(date);
}

export default function DateMenu({
  selectedDate,
  availableDates,
  today,
  onChange,
}: DateMenuProps) {
  const cleanDates = Array.from(new Set([today, selectedDate, ...availableDates]))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return (
    <section className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">Date Menu</p>
          <h2 className="mt-1 text-2xl font-bold">Select Date</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onChange(shiftDate(selectedDate, -1))}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            โ Prev
          </button>

          <button
            onClick={() => onChange(today)}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300"
          >
            Today
          </button>

          <button
            onClick={() => onChange(shiftDate(selectedDate, 1))}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            Next โ’
          </button>

          <select
            value={selectedDate}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
          >
            {cleanDates.map((date) => (
              <option key={date} value={date}>
                {date === today ? "Today โ€” " : ""}
                {formatDateForMenu(date)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>
      </div>
    </section>
  );
}
