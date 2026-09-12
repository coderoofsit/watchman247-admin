import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  CalendarDays,
  Shield,
  Users,
  Loader2,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import CalendarView from '../components/CalendarView.jsx';

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'guards', label: 'Guards', icon: Shield },
  { id: 'clients', label: 'Clients', icon: Users },
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-blue)]/10 text-[var(--color-blue)]">
          <BarChart3 size={18} />
        </span>
      </div>
    </div>
  );
}

function buildUserStats(events) {
  const now = new Date();
  const todayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const bookingIds = new Set();
  const bookingsThisWeek = new Set();
  const bookingsToday = new Set();

  for (const event of events) {
    if (!event.bookingId || !event.startDate) continue;
    bookingIds.add(event.bookingId);
    if (event.startDate === todayKey) bookingsToday.add(event.bookingId);
    const eventDate = new Date(`${event.startDate}T00:00:00`);
    if (eventDate >= weekStart && eventDate < weekEnd) {
      bookingsThisWeek.add(event.bookingId);
    }
  }

  return {
    totalBookings: bookingIds.size,
    bookingsThisWeek: bookingsThisWeek.size,
    bookingsToday: bookingsToday.size,
  };
}

function PeopleTable({ rows, columns, emptyLabel, loading, onRowClick }) {
  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="animate-spin text-[var(--color-blue)]" size={28} />
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row._id}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`border-b border-slate-100 last:border-0 ${
                  onRowClick
                    ? 'cursor-pointer transition hover:bg-[var(--color-blue)]/5'
                    : ''
                }`}
                onClick={() => {
                  if (typeof onRowClick === 'function') onRowClick(row);
                }}
                onKeyDown={(e) => {
                  if (!onRowClick) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'calendar';
  const selectedUserId = searchParams.get('userId');
  const selectedUserType = searchParams.get('userType');

  const [calendarData, setCalendarData] = useState({ events: [], stats: null });
  const [guards, setGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [search, setSearch] = useState('');

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'calendar') next.delete('tab');
    else next.set('tab', tab);
    next.delete('userId');
    next.delete('userType');
    setSearchParams(next);
    setSearch('');
  };

  const openUserCalendar = useCallback(
    (row, userType) => {
      const next = new URLSearchParams(searchParams);
      next.set('tab', userType === 'guard' ? 'guards' : 'clients');
      next.set('userId', String(row._id));
      next.set('userType', userType);
      setSearchParams(next);
      setSearch('');
    },
    [searchParams, setSearchParams]
  );

  const clearSelectedUser = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('userId');
    next.delete('userType');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const res = await apiRequest('/admin/calendar');
      setCalendarData({
        events: res?.data?.events || [],
        stats: res?.data?.stats || {
          totalBookings: 0,
          bookingsThisWeek: 0,
          bookingsToday: 0,
        },
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load calendar');
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  const fetchGuards = useCallback(async () => {
    setLoadingGuards(true);
    try {
      const res = await apiRequest('/admin/users/guards?type=all');
      setGuards(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load guards');
    } finally {
      setLoadingGuards(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const res = await apiRequest('/admin/users/clients');
      setClients(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar' || selectedUserId) fetchCalendar();
    if (activeTab === 'guards') fetchGuards();
    if (activeTab === 'clients') fetchClients();
  }, [activeTab, selectedUserId, fetchCalendar, fetchGuards, fetchClients]);

  const filteredGuards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guards;
    return guards.filter((g) =>
      [
        g.fullName,
        g.email,
        g.phone,
        g.profile?.guardId,
        g.profile?.availabilityStatus,
        g.profile?.availabilityStatus === 'available'
          ? 'online'
          : g.profile?.availabilityStatus === 'on_job'
            ? 'on job'
            : 'offline',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [guards, search]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.fullName, c.email, c.phone, c.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [clients, search]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    if (selectedUserType === 'guard' || activeTab === 'guards') {
      return guards.find((g) => String(g._id) === String(selectedUserId)) || null;
    }
    if (selectedUserType === 'client' || activeTab === 'clients') {
      return clients.find((c) => String(c._id) === String(selectedUserId)) || null;
    }
    return null;
  }, [selectedUserId, selectedUserType, activeTab, guards, clients]);

  const userEvents = useMemo(() => {
    if (!selectedUserId) return [];
    const id = String(selectedUserId);
    const type = selectedUserType || (activeTab === 'guards' ? 'guard' : 'client');
    return type === 'guard'
      ? calendarData.events.filter((e) => String(e.guardId) === id)
      : calendarData.events.filter((e) => String(e.clientId) === id);
  }, [selectedUserId, selectedUserType, activeTab, calendarData.events]);

  const userStats = useMemo(() => buildUserStats(userEvents), [userEvents]);

  const showingUserCalendar =
    Boolean(selectedUserId) && (activeTab === 'guards' || activeTab === 'clients');

  const stats = calendarData.stats || {
    totalBookings: 0,
    bookingsThisWeek: 0,
    bookingsToday: 0,
  };

  const renderUserCalendar = () => {
    const label =
      selectedUserType === 'guard' || activeTab === 'guards' ? 'Guard' : 'Client';
    const name = selectedUser?.fullName || `${label} calendar`;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={clearSelectedUser}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg)]"
          >
            <ArrowLeft size={16} />
            Back to {activeTab === 'guards' ? 'guards' : 'clients'}
          </button>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{name}</h2>
            <p className="text-sm text-slate-400">
              Bookings for this {label.toLowerCase()} only.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Bookings" value={userStats.totalBookings} />
          <StatCard label="Total Booking this Week" value={userStats.bookingsThisWeek} />
          <StatCard label="Total Bookings Today" value={userStats.bookingsToday} />
        </div>

        {loadingCalendar ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="animate-spin text-[var(--color-blue)]" size={28} />
            <p className="mt-3 text-sm text-slate-500">Loading calendar…</p>
          </div>
        ) : (
          <CalendarView events={userEvents} theme="admin" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            View bookings, browse guards, and manage client visibility.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-[var(--color-blue)]/15 text-[var(--color-blue)] border border-[var(--color-blue)]/25'
                  : 'text-slate-400 hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] border border-transparent'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total Bookings" value={stats.totalBookings} />
            <StatCard label="Total Booking this Week" value={stats.bookingsThisWeek} />
            <StatCard label="Total Bookings Today" value={stats.bookingsToday} />
          </div>

          {loadingCalendar ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 className="animate-spin text-[var(--color-blue)]" size={28} />
              <p className="mt-3 text-sm text-slate-500">Loading calendar…</p>
            </div>
          ) : (
            <CalendarView events={calendarData.events} theme="admin" />
          )}
        </div>
      )}

      {activeTab === 'guards' && (
        showingUserCalendar ? (
          renderUserCalendar()
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guards…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-blue)]/40"
              />
            </div>
            <PeopleTable
              loading={loadingGuards}
              emptyLabel="No guards found."
              rows={filteredGuards}
              onRowClick={(row) => openUserCalendar(row, 'guard')}
              columns={[
                {
                  key: 'fullName',
                  label: 'Guard',
                  render: (row) => {
                    const availability = row.profile?.availabilityStatus || 'unavailable';
                    const isOnline = availability === 'available';
                    const isOnJob = availability === 'on_job';
                    return (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blue)]/10 text-xs font-bold text-[var(--color-blue)]">
                            {(row.fullName || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                              isOnline
                                ? 'bg-emerald-500'
                                : isOnJob
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                            }`}
                            title={isOnline ? 'Online' : isOnJob ? 'On job' : 'Offline'}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{row.fullName}</p>
                          <p className="text-xs text-slate-500">{row.profile?.guardId || 'No ID'}</p>
                        </div>
                      </div>
                    );
                  },
                },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                {
                  key: 'availability',
                  label: 'Online',
                  render: (row) => {
                    const availability = row.profile?.availabilityStatus || 'unavailable';
                    if (availability === 'available') {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      );
                    }
                    if (availability === 'on_job') {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          On Job
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Offline
                      </span>
                    );
                  },
                },
                {
                  key: 'verificationStatus',
                  label: 'Status',
                  render: (row) => (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {row.verificationStatus || 'pending'}
                      </span>
                      {row.status && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {row.status}
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )
      )}

      {activeTab === 'clients' && (
        showingUserCalendar ? (
          renderUserCalendar()
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-blue)]/40"
              />
            </div>
            <PeopleTable
              loading={loadingClients}
              emptyLabel="No clients found."
              rows={filteredClients}
              onRowClick={(row) => openUserCalendar(row, 'client')}
              columns={[
                {
                  key: 'fullName',
                  label: 'Client',
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blue)]/15 text-xs font-bold text-[var(--color-blue)]">
                        {(row.fullName || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'phone', label: 'Phone' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        row.status === 'suspended'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {row.status || 'active'}
                    </span>
                  ),
                },
                {
                  key: 'createdAt',
                  label: 'Joined',
                  render: (row) =>
                    row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—',
                },
              ]}
            />
          </div>
        )
      )}
    </div>
  );
}
