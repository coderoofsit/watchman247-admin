import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  UserCheck,
  FileSearch,
  GraduationCap,
  Flag,
  CalendarDays,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { apiRequest } from '../services/api.js';

const CHART_BLUE = '#4ACDFF';
const CHART_PURPLE = '#A5A5FF';
const CHART_MINT = '#86E3CE';
const CHART_GOLD = '#CC9933';
const CHART_BLUE_DARK = '#1552AB';

const PIE_COLORS = [CHART_BLUE_DARK, CHART_GOLD, CHART_PURPLE, CHART_MINT, CHART_BLUE];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

function StatCard({ label, value, icon: Icon, to, accent }) {
  const content = (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] h-full transition hover:border-[var(--color-blue)]/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
      {to ? (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--color-blue)]">
          View <ArrowUpRight size={12} />
        </div>
      ) : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] rounded-2xl">
        {content}
      </Link>
    );
  }
  return content;
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-[var(--color-text-secondary)]">
      {label}
    </div>
  );
}

function buildBookingsByDay(events) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  const seen = new Set();

  for (const event of events) {
    if (!event.startDate || !event.bookingId) continue;
    const key = `${event.bookingId}-${event.startDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const d = new Date(`${event.startDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    counts[days[d.getDay()]] += 1;
  }

  return days.map((name) => ({ name, bookings: counts[name] }));
}

function buildBookingsTrend(events) {
  const now = new Date();
  const points = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    points.push({
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      bookings: 0,
    });
  }

  const index = Object.fromEntries(points.map((p) => [p.key, p]));
  const seen = new Set();
  for (const event of events) {
    if (!event.startDate || !event.bookingId) continue;
    const dedupe = `${event.bookingId}-${event.startDate}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    if (index[event.startDate]) {
      index[event.startDate].bookings += 1;
    }
  }

  return points.map(({ label, bookings }) => ({ label, bookings }));
}

function buildComplaintStatusData(complaints) {
  const order = ['open', 'under_review', 'resolved', 'rejected', 'closed'];
  const counts = Object.fromEntries(order.map((s) => [s, 0]));
  for (const row of complaints) {
    const key = row.status || 'open';
    counts[key] = (counts[key] || 0) + 1;
  }
  return order
    .filter((s) => counts[s] > 0)
    .map((status) => ({
      name: status.replaceAll('_', ' '),
      value: counts[status],
      status,
    }));
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [guards, setGuards] = useState([]);
  const [reviewGuards, setReviewGuards] = useState([]);
  const [trainingGuards, setTrainingGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    bookingsThisWeek: 0,
    bookingsToday: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [calendarRes, guardsRes, reviewRes, trainingRes, clientsRes, complaintsRes] =
        await Promise.all([
          apiRequest('/admin/calendar'),
          apiRequest('/admin/users/guards?type=all'),
          apiRequest('/admin/users/guards?type=review'),
          apiRequest('/admin/users/guards?type=training'),
          apiRequest('/admin/users/clients'),
          apiRequest('/admin/complaints'),
        ]);

      setEvents(calendarRes?.data?.events || []);
      setBookingStats(
        calendarRes?.data?.stats || {
          totalBookings: 0,
          bookingsThisWeek: 0,
          bookingsToday: 0,
        },
      );
      setGuards(Array.isArray(guardsRes?.data) ? guardsRes.data : []);
      setReviewGuards(Array.isArray(reviewRes?.data) ? reviewRes.data : []);
      setTrainingGuards(Array.isArray(trainingRes?.data) ? trainingRes.data : []);
      setClients(Array.isArray(clientsRes?.data) ? clientsRes.data : []);
      setComplaints(Array.isArray(complaintsRes?.data) ? complaintsRes.data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load home dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verifiedCount = useMemo(
    () =>
      guards.filter((g) =>
        ['verified', 'completed'].includes(g.verificationStatus),
      ).length,
    [guards],
  );

  const openComplaints = useMemo(
    () => complaints.filter((c) => ['open', 'under_review'].includes(c.status)).length,
    [complaints],
  );

  const pipelineData = useMemo(
    () => [
      { name: 'Verified', value: verifiedCount },
      { name: 'Under review', value: reviewGuards.length },
      { name: 'Training', value: trainingGuards.length },
    ].filter((d) => d.value > 0),
    [verifiedCount, reviewGuards.length, trainingGuards.length],
  );

  const weekdayData = useMemo(() => buildBookingsByDay(events), [events]);
  const trendData = useMemo(() => buildBookingsTrend(events), [events]);
  const complaintPie = useMemo(() => buildComplaintStatusData(complaints), [complaints]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...events]
      .filter((e) => e.startDate)
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
      .filter((e) => {
        const d = new Date(`${e.startDate}T00:00:00`);
        return d >= today;
      })
      .slice(0, 8);
  }, [events]);

  const recentReviews = useMemo(() => reviewGuards.slice(0, 6), [reviewGuards]);

  const recentComplaints = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6),
    [complaints],
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-blue)]" size={32} />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Home</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Platform overview across guards, clients, bookings, and complaints.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Total guards"
          value={guards.length}
          icon={Users}
          to="/users/verified-guards"
          accent={CHART_BLUE_DARK}
        />
        <StatCard
          label="Clients"
          value={clients.length}
          icon={UserCheck}
          to="/users/clients"
          accent={CHART_MINT}
        />
        <StatCard
          label="Under review"
          value={reviewGuards.length}
          icon={FileSearch}
          to="/users/under-review"
          accent={CHART_GOLD}
        />
        <StatCard
          label="In training"
          value={trainingGuards.length}
          icon={GraduationCap}
          to="/users/under-training"
          accent={CHART_PURPLE}
        />
        <StatCard
          label="Open complaints"
          value={openComplaints}
          icon={Flag}
          to="/inbox?tab=complaints"
          accent="#ef4444"
        />
        <StatCard
          label="Bookings"
          value={bookingStats.totalBookings}
          icon={CalendarDays}
          to="/calendar"
          accent={CHART_BLUE}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Bookings today
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {bookingStats.bookingsToday}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Bookings this week
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {bookingStats.bookingsThisWeek}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Active clients
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {clients.filter((c) => c.status === 'active').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard
          title="Bookings — last 7 days"
          subtitle="Unique bookings by start date"
          className="xl:col-span-2"
        >
          {trendData.every((d) => d.bookings === 0) ? (
            <EmptyChart label="No recent booking activity" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_BLUE_DARK} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_BLUE_DARK} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#8E94A9', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8E94A9', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E9F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke={CHART_BLUE_DARK}
                    strokeWidth={2}
                    fill="url(#bookingFill)"
                    name="Bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Guard pipeline" subtitle="Current verification stages">
          {pipelineData.length === 0 ? (
            <EmptyChart label="No guard data" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {pipelineData.map((_, i) => (
                      <Cell key={pipelineData[i].name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E9F0',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-[var(--color-text-secondary)]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Bookings by weekday" subtitle="Distribution across the week">
          {weekdayData.every((d) => d.bookings === 0) ? (
            <EmptyChart label="No booking schedule data" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#8E94A9', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8E94A9', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E9F0',
                    }}
                  />
                  <Bar dataKey="bookings" name="Bookings" fill={CHART_BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Complaints by status" subtitle="All recorded complaints">
          {complaintPie.length === 0 ? (
            <EmptyChart label="No complaints yet" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {complaintPie.map((_, i) => (
                      <Cell key={complaintPie[i].status} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E9F0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Pending reviews
            </h2>
            <Link
              to="/users/under-review"
              className="text-xs font-semibold text-[var(--color-blue)] hover:underline"
            >
              See all
            </Link>
          </div>
          {recentReviews.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center text-[var(--color-text-secondary)]">
              No applications waiting.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--color-bg)] text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Guard</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReviews.map((g) => (
                    <tr key={g._id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {g.fullName || '—'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {g.email || g.phone || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">
                        {(g.verificationStatus || 'pending').replaceAll('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Recent complaints
            </h2>
            <Link
              to="/inbox?tab=complaints"
              className="text-xs font-semibold text-[var(--color-blue)] hover:underline"
            >
              Inbox
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center text-[var(--color-text-secondary)]">
              No complaints filed.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--color-bg)] text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c._id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-text-primary)] line-clamp-1">
                          {c.subject || 'Untitled'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {formatDate(c.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">
                        {(c.status || 'open').replaceAll('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Upcoming shifts
            </h2>
            <Link
              to="/calendar"
              className="text-xs font-semibold text-[var(--color-blue)] hover:underline"
            >
              Calendar
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center text-[var(--color-text-secondary)]">
              No upcoming shifts.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--color-bg)] text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Shift</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEvents.map((e, idx) => (
                    <tr
                      key={e.id || e.bookingId || `${e.startDate}-${idx}`}
                      className="border-t border-[var(--color-border)]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-text-primary)] line-clamp-1">
                          {e.title || e.serviceType || 'Shift'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] capitalize">
                          {e.status || e.assignmentStatus || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {e.startDate || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
