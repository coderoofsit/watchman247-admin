import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import toast from 'react-hot-toast';
import {
  Flag,
  Loader2,
  Search,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const statusStyles = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function StatusPill({ status }) {
  const key = status || 'open';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${
        statusStyles[key] || statusStyles.open
      }`}
    >
      {(status || 'open').replaceAll('_', ' ')}
    </span>
  );
}

export default function ComplaintsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: 'open',
    priority: 'medium',
    resolution: '',
    adminNotes: '',
  });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await apiRequest(`/admin/complaints${query}`);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const guardName = row.againstGuard?.user?.fullName || '';
      const guardId = row.againstGuard?.guardId || '';
      const clientName = row.complainant?.fullName || '';
      return (
        row.subject?.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q) ||
        row.category?.toLowerCase().includes(q) ||
        guardName.toLowerCase().includes(q) ||
        guardId.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const openComplaint = (row) => {
    setSelected(row);
    setForm({
      status: row.status || 'open',
      priority: row.priority || 'medium',
      resolution: row.resolution || '',
      adminNotes: row.adminNotes || '',
    });
  };

  const handleSave = async () => {
    if (!selected?._id) return;
    setSaving(true);
    try {
      const res = await apiRequest(`/admin/complaints/${selected._id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      const updated = res?.data || { ...selected, ...form };
      setRows((prev) =>
        prev.map((row) => (row._id === selected._id ? updated : row)),
      );
      setSelected(updated);
      toast.success('Complaint updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Complaints</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Review and resolve client complaints against guards and bookings.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, client, guard…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-blue)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[var(--color-border)] bg-white text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="animate-spin" size={18} />
            Loading complaints…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-secondary)]">
            <Flag size={22} className="opacity-40" />
            No complaints found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg)] text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Against</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Filed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row._id}
                    onClick={() => openComplaint(row)}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{row.subject}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] capitalize">
                        {(row.category || '').replaceAll('_', ' ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                      {row.complainant?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--color-text-primary)]">
                        {row.againstGuard?.user?.fullName || '—'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {row.againstGuard?.guardId || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">
                      {row.priority || 'medium'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-[var(--color-border)] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)] sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{selected.subject}</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Filed {formatDate(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-[var(--color-border)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">Client</p>
                  <p className="font-medium">{selected.complainant?.fullName || '—'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{selected.complainant?.email || ''}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">Against guard</p>
                  <p className="font-medium">{selected.againstGuard?.user?.fullName || '—'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {selected.againstGuard?.guardId || ''}
                    {selected.againstGuard?.grade ? ` · Grade ${selected.againstGuard.grade}` : ''}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">Description</p>
                <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                  {selected.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-white"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Priority</span>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-white capitalize"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Resolution</span>
                <textarea
                  value={form.resolution}
                  onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white resize-y"
                  placeholder="How was this resolved?"
                />
              </label>

              <label className="block text-sm">
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Admin notes</span>
                <textarea
                  value={form.adminNotes}
                  onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white resize-y"
                  placeholder="Internal notes (not shown to client)"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-blue)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : form.status === 'resolved' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
