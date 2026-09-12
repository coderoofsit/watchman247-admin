import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEWS = ['month', 'week', 'day', 'booking'];

function parseDateKey(key) {
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function eventTitle(event) {
  return event.title || event.serviceType || 'Booking';
}

/**
 * Shared calendar grid used by admin, client, and guard portals.
 * theme: 'admin' | 'client' | 'guard'
 */
export default function CalendarView({
  events = [],
  theme = 'admin',
  searchPlaceholder = 'Search Booking..',
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [view, setView] = useState('month');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => {
      const haystack = [
        event.title,
        event.serviceType,
        event.clientName,
        event.guardName,
        event.location,
        event.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of filtered) {
      const key = event.startDate;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [filtered]);

  const goToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setCursor(now);
  };

  const goPrev = () => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(next.getMonth() - 1);
    else if (view === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCursor(next);
  };

  const goNext = () => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(next.getMonth() + 1);
    else if (view === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCursor(next);
  };

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  // All portal themes share the light navy/white design system
  const isLight = true;

  const shell = 'rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]';

  const muted = 'text-[var(--color-text-secondary)]';
  const strong = 'text-[var(--color-text-primary)]';
  const chip = 'bg-[var(--color-blue)] text-white border border-[var(--color-blue)]';
  const activeView = 'bg-[var(--color-blue)] text-white border-[var(--color-blue)]';
  const idleView = 'bg-white text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]';

  const renderDayEvents = (day, limit = 3) => {
    const key = toDateKey(day);
    const dayEvents = eventsByDay.get(key) || [];
    return (
      <>
        {dayEvents.slice(0, limit).map((event) => (
          <div
            key={event.id}
            className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${chip}`}
            title={`${eventTitle(event)} ${event.startTime || ''}`}
          >
            {eventTitle(event)}
          </div>
        ))}
        {dayEvents.length > limit && (
          <div className={`text-[10px] font-medium ${muted}`}>
            +{dayEvents.length - limit} more
          </div>
        )}
      </>
    );
  };

  const heading =
    view === 'month'
      ? monthLabel(cursor)
      : view === 'week'
        ? `Week of ${startOfWeek(cursor).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`
        : cursor.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });

  return (
    <div className={`${shell} p-4 md:p-6`}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className={`text-lg font-bold ${strong}`}>Calendar View</h3>
          <p className={`mt-0.5 text-sm ${muted}`}>{heading}</p>
        </div>

        <div className="relative w-full lg:max-w-xs">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={
              isLight
                ? 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[var(--color-blue)]/40'
                : 'w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--color-blue)]/40'
            }
          />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${idleView}`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={goPrev}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${idleView}`}
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${idleView}`}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/80 p-1 dark:border-white/10">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide border ${
                view === v ? activeView : idleView
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'booking' ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className={`py-10 text-center text-sm ${muted}`}>No bookings found.</p>
          ) : (
            filtered.map((event) => (
              <div
                key={event.id}
                className={
                  isLight
                    ? 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'
                    : 'rounded-xl border border-white/5 bg-[var(--color-bg)] px-4 py-3'
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-bold ${strong}`}>{eventTitle(event)}</p>
                    <p className={`mt-1 text-xs ${muted}`}>
                      {[event.clientName, event.guardName, event.location]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${chip}`}>
                    {event.status || 'scheduled'}
                  </span>
                </div>
                <p className={`mt-2 text-xs ${muted}`}>
                  {event.startDate}
                  {event.startTime ? ` · ${event.startTime}` : ''}
                  {event.endTime ? ` – ${event.endTime}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      ) : view === 'day' ? (
        <div>
          <div
            className={
              isLight
                ? 'mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3'
                : 'mb-3 flex items-center justify-between rounded-xl bg-[var(--color-bg)] px-4 py-3'
            }
          >
            <p className={`text-sm font-bold ${strong}`}>
              {cursor.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <p className={`text-xs ${muted}`}>
              {(eventsByDay.get(toDateKey(cursor)) || []).length} booking(s)
            </p>
          </div>
          <div className="space-y-2">
            {(eventsByDay.get(toDateKey(cursor)) || []).length === 0 ? (
              <p className={`py-8 text-center text-sm ${muted}`}>No bookings on this day.</p>
            ) : (
              (eventsByDay.get(toDateKey(cursor)) || []).map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl border px-4 py-3 ${
                    isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-[var(--color-bg)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${strong}`}>{eventTitle(event)}</p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {event.startTime || '—'}
                    {event.endTime ? ` – ${event.endTime}` : ''}
                    {event.guardName ? ` · ${event.guardName}` : ''}
                    {event.clientName ? ` · ${event.clientName}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="mb-2 grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={`px-2 text-center text-xs font-bold uppercase tracking-wider ${muted}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(view === 'month' ? monthCells : weekCells).map((day) => {
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = sameDay(day, new Date());
                const key = toDateKey(day);
                const count = (eventsByDay.get(key) || []).length;

                return (
                  <button
                    key={key + String(day.getMonth())}
                    type="button"
                    onClick={() => {
                      setCursor(day);
                      setView('day');
                    }}
                    className={`min-h-[96px] rounded-xl border p-2 text-left transition ${
                      isLight
                        ? inMonth
                          ? 'border-slate-200 bg-white hover:border-[var(--color-blue)]/30'
                          : 'border-transparent bg-slate-50/70 text-slate-400'
                        : inMonth
                          ? 'border-white/5 bg-[var(--color-bg)] hover:border-[var(--color-blue)]/30'
                          : 'border-transparent bg-transparent opacity-40'
                    } ${isToday ? 'ring-1 ring-[var(--color-blue)]/40' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday ? 'text-[var(--color-blue)]' : strong
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {count > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chip}`}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">{renderDayEvents(day, view === 'week' ? 5 : 2)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { parseDateKey, toDateKey };
