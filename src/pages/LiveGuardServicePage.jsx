import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2,
  Radio,
  RefreshCw,
  MapPin,
  Shield,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';

const TERMINAL = new Set(['completed', 'cancelled', 'no_show']);
const REFRESH_MS = 30_000;

function parseShiftDateTime(dateKey, time) {
  if (!dateKey || !time) return null;
  const t = String(time).length === 5 ? `${time}:00` : String(time);
  const d = new Date(`${dateKey}T${t}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatClock(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDateTime(date) {
  if (!date) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatRemaining(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function isOngoingShift(event, now) {
  if (TERMINAL.has(event.status)) return false;

  const start =
    (event.startedAt ? new Date(event.startedAt) : null) ||
    parseShiftDateTime(event.startDate, event.startTime);
  const end = parseShiftDateTime(event.endDate, event.endTime);

  if (event.status === 'active') {
    if (end && now > end) return false;
    return true;
  }

  if (!start || !end) return false;
  return now >= start && now < end;
}

function RemainingCell({ endAt, now, totalMs }) {
  const remainingMs = endAt ? endAt.getTime() - now.getTime() : 0;
  const overdue = remainingMs <= 0;
  const urgent = !overdue && remainingMs < 30 * 60 * 1000;
  const progress =
    totalMs > 0
      ? Math.min(100, Math.max(0, ((totalMs - Math.max(0, remainingMs)) / totalMs) * 100))
      : 0;

  return (
    <div className="min-w-[140px]">
      <div
        className={`font-mono text-base font-semibold tabular-nums tracking-wider ${
          overdue
            ? 'text-red-600 animate-pulse'
            : urgent
              ? 'text-amber-600 animate-pulse'
              : 'text-[var(--color-text-primary)]'
        }`}
      >
        {overdue ? 'Ended' : formatRemaining(remainingMs)}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            overdue
              ? 'bg-red-500'
              : urgent
                ? 'bg-amber-500'
                : 'bg-[var(--color-blue)]'
          }`}
          style={{ width: `${overdue ? 100 : progress}%` }}
        />
      </div>
    </div>
  );
}

export default function LiveGuardServicePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchLive = useCallback(async ({ silent } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiRequest('/admin/calendar');
      setEvents(Array.isArray(res?.data?.events) ? res.data.events : []);
      setLastFetchedAt(new Date());
    } catch (err) {
      toast.error(err.message || 'Failed to load live shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => fetchLive({ silent: true }), REFRESH_MS);
    return () => clearInterval(poll);
  }, [fetchLive]);

  const liveShifts = useMemo(() => {
    return events
      .filter((e) => isOngoingShift(e, now))
      .map((e) => {
        const scheduledStart = parseShiftDateTime(e.startDate, e.startTime);
        const startedAt = e.startedAt ? new Date(e.startedAt) : scheduledStart;
        const endAt = parseShiftDateTime(e.endDate, e.endTime);
        const totalMs =
          startedAt && endAt ? Math.max(0, endAt.getTime() - startedAt.getTime()) : 0;
        return { ...e, startedAt, endAt, totalMs };
      })
      .sort((a, b) => {
        const aEnd = a.endAt?.getTime() ?? Infinity;
        const bEnd = b.endAt?.getTime() ?? Infinity;
        return aEnd - bEnd;
      });
  }, [events, now]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Live Guard Service
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Currently ongoing shifts with live remaining time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Live clock
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums text-[var(--color-text-primary)] tracking-wider">
              {formatClock(now)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Active now
            </p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
              {liveShifts.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchLive({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {lastFetchedAt ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Data refreshed {formatDateTime(lastFetchedAt)} · auto-refresh every 30s
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white">
          <Loader2 className="animate-spin text-[var(--color-blue)]" size={32} />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Loading live shifts…</p>
        </div>
      ) : liveShifts.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white text-center px-6">
          <Radio className="text-[var(--color-text-muted)]" size={36} strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">
            No ongoing shifts right now
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Active guard services will appear here when a shift is in progress.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Guard</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Service / location</th>
                  <th className="px-4 py-3">Started at</th>
                  <th className="px-4 py-3">Ends at</th>
                  <th className="px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {liveShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/60 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blue)]/10 text-[var(--color-blue)]">
                          <Shield size={16} strokeWidth={1.75} />
                        </span>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {shift.guardName || '—'}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {shift.guardCode || 'No ID'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {shift.clientName || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <p className="font-medium text-[var(--color-text-primary)] line-clamp-1">
                        {shift.serviceType || '—'}
                      </p>
                      {shift.location ? (
                        <p className="mt-0.5 flex items-start gap-1 text-xs text-[var(--color-text-secondary)]">
                          <MapPin size={12} className="mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{shift.location}</span>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                      {formatDateTime(shift.startedAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                      {formatDateTime(shift.endAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <RemainingCell
                        endAt={shift.endAt}
                        now={now}
                        totalMs={shift.totalMs}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
