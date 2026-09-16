import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api.js';
import toast from 'react-hot-toast';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  FileCheck,
  UserCheck,
  UserX,
  CheckCircle,
  AlertTriangle,
  UserMinus,
  UserPlus,
  MapPin,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const VERIFY_STEPS = [
  { id: 1, key: 'address', label: 'Address', icon: MapPin },
  { id: 2, key: 'profile', label: 'Profile', icon: User },
  { id: 3, key: 'documents', label: 'Documents', icon: FileText },
  { id: 4, key: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 5, key: 'review', label: 'Review', icon: FileCheck },
];

export default function UserManagement({ mode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [guardDetails, setGuardDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeModalStep, setActiveModalStep] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    guardId: '',
    grade: 'A',
    trainingName: '',
    trainingStartDate: '',
    trainingEndDate: '',
    trainingLocation: ''
  });

  const handleCloseVerifyModal = () => {
    setShowVerifyModal(false);
    setVerifyForm({
      guardId: '',
      grade: 'A',
      trainingName: '',
      trainingStartDate: '',
      trainingEndDate: '',
      trainingLocation: ''
    });
  };

  const fetchGuardDetails = async (userId) => {
    setModalLoading(true);
    setActionError('');
    setActiveModalStep(1);
    try {
      const response = await apiRequest(`/admin/users/guards/${userId}`, { method: 'GET' });
      setGuardDetails(response?.data || response);
    } catch (err) {
      setActionError(err.message || 'Failed to load guard details.');
    } finally {
      setModalLoading(false);
    }
  };

  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [docRejectReasonInput, setDocRejectReasonInput] = useState('');

  const handleVerifyDocument = async (docId, status, reason = '') => {
    setActionError('');
    try {
      await apiRequest(`/admin/users/documents/${docId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (selectedGuard) {
        // Refresh detailed dossier
        const response = await apiRequest(`/admin/users/guards/${selectedGuard._id}`, { method: 'GET' });
        setGuardDetails(response?.data || response);
      }
      setRejectingDocId(null);
      setDocRejectReasonInput('');
      toast.success(status === 'verified' ? 'Document approved!' : 'Document rejected.');
    } catch (err) {
      setActionError(err.message || 'Failed to verify document.');
      toast.error(err.message || 'Failed to verify document.');
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    let endpoint = '';
    if (mode === 'verified') endpoint = '/admin/users/guards?type=verified';
    else if (mode === 'review') endpoint = '/admin/users/guards?type=review';
    else if (mode === 'training') endpoint = '/admin/users/guards?type=training';
    else if (mode === 'clients') endpoint = '/admin/users/clients';

    try {
      const response = await apiRequest(endpoint, { method: 'GET' });
      setData(response?.data || response || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
    setSelectedGuard(null);
    setGuardDetails(null);
    setActiveModalStep(1);
    setZoomedImage(null);
    setRejectingDocId(null);
    setDocRejectReasonInput('');
    setRejecting(false);
    setRejectionReason('');
    setActionError('');
  }, [fetchData]);

  const handleVerify = async (userId, status, reasonOrPayload = '') => {
    setSubmittingAction(true);
    setActionError('');
    try {
      const bodyPayload = typeof reasonOrPayload === 'object'
        ? { status, ...reasonOrPayload }
        : { status, rejectionReason: reasonOrPayload };

      await apiRequest(`/admin/users/guards/${userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(bodyPayload),
      });
      setSelectedGuard(null);
      setGuardDetails(null);
      setActiveModalStep(1);
      setZoomedImage(null);
      setRejectingDocId(null);
      setDocRejectReasonInput('');
      setRejecting(false);
      setRejectionReason('');
      fetchData();
      toast.success(
        status === 'verified'
          ? 'Guard verified successfully!'
          : status === 'partially_rejected'
            ? 'Guard application partially rejected.'
            : 'Guard application rejected.'
      );
    } catch (err) {
      setActionError(err.message || 'Operation failed.');
      toast.error(err.message || 'Operation failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleClientStatus = async (userId) => {
    try {
      await apiRequest(`/admin/users/clients/${userId}/toggle-status`, {
        method: 'PATCH',
      });
      fetchData();
      toast.success('Client status updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update client status.');
    }
  };

  const filteredData = data.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.fullName?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.phone?.includes(term) ||
      (item.clientId && item.clientId.toLowerCase().includes(term)) ||
      (item.guardId && item.guardId.toLowerCase().includes(term)) ||
      (item.profile?.guardId && item.profile.guardId.toLowerCase().includes(term))
    );
  });

  const getDocTypeName = (type) => {
    const types = {
      ghana_card: 'Ghana Card',
      passport: 'Passport',
      drivers_license: 'Drivers License',
      voter_id: 'Voter ID',
      ssnit_card: 'SSNIT Card',
      education_certificate: 'Education Certificate',
      medical_report: 'Medical Report',
      police_clearance: 'Police Clearance',
      criminal_background_check: 'Criminal Background Check',
      previous_experience: 'Experience Doc',
      working_permit: 'Work Permit',
      other: 'Other'
    };
    return types[type] || type.replace(/_/g, ' ');
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      [addr.city, addr.region].filter(Boolean).join(', '),
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'N/A';
  };

  const goToModalStep = (step) => {
    setActiveModalStep(Math.min(Math.max(step, 1), VERIFY_STEPS.length));
  };

  const getGuarantorIdImages = (guarantor) => {
    const front =
      guarantor?.ghanaCard?.fileUrl
      || guarantor?.ghanaCardFile?.url
      || null;
    const back = guarantor?.ghanaCard?.fileUrlBack || null;
    return { front, back };
  };

  const getApproveVerifyGate = (details) => {
    const docs = details?.documents || [];
    const requiredTypes = [
      { type: 'ghana_card', label: 'Ghana Card' },
      { type: 'police_clearance', label: 'Police Clearance' },
      { type: 'medical_report', label: 'Medical Report' },
      { type: 'ssnit_card', label: 'SSNIT Card' },
    ];

    if (!docs.length) {
      return { canApprove: false, reason: 'No documents uploaded yet.' };
    }

    for (const req of requiredTypes) {
      const matches = docs.filter((d) => d.documentType === req.type);
      if (!matches.length) {
        return { canApprove: false, reason: `Missing required document: ${req.label}.` };
      }
      const unverified = matches.filter((d) => d.verificationStatus !== 'verified');
      if (unverified.length) {
        const side = unverified[0].title ? ` (${unverified[0].title})` : '';
        return {
          canApprove: false,
          reason: `Approve all ${req.label} files first${side}.`,
        };
      }
    }

    const otherPending = docs.filter((d) => d.verificationStatus !== 'verified');
    if (otherPending.length) {
      return {
        canApprove: false,
        reason: `Approve remaining documents first (${otherPending.length} left).`,
      };
    }

    return { canApprove: true, reason: null };
  };

  const approveVerifyGate = getApproveVerifyGate(guardDetails);

  const renderIdImage = (url, label) => (
    <div key={label} className="space-y-1.5">
      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
      {url ? (
        <div className="relative group w-full h-40 bg-white border border-[#e8ecf1] rounded-xl overflow-hidden flex items-center justify-center">
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => setZoomedImage(url)}
              className="w-7 h-7 bg-black/65 hover:bg-[#1a56b4] text-white rounded-lg transition flex items-center justify-center cursor-pointer"
              title={`Zoom ${label}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 bg-black/65 hover:bg-[#1a56b4] text-white rounded-lg transition flex items-center justify-center"
              title={`Open ${label}`}
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-white border border-dashed border-[#e8ecf1] rounded-xl flex items-center justify-center text-[11px] text-slate-400 italic">
          No {label.toLowerCase()} uploaded
        </div>
      )}
    </div>
  );

  const renderDocumentCard = (doc) => (
    <div key={doc._id || `${doc.documentType}-${doc.title}`} className="neo-flat p-5 border border-[#e8ecf1] flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between border-b border-[#e8ecf1] pb-2">
        <div>
          <span className="font-bold text-slate-800 text-sm">{getDocTypeName(doc.documentType)}</span>
          {doc.title && <p className="text-[10px] text-slate-500">{doc.title}</p>}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${doc.verificationStatus === 'verified'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : doc.verificationStatus === 'rejected'
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
          {doc.verificationStatus || 'pending'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 border-b border-[#e8ecf1] pb-3">
        <div>
          <span className="text-slate-500 block">Doc Number</span>
          <span className="font-semibold text-slate-800 break-all">{doc.documentNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Issue Date</span>
          <span className="font-semibold text-slate-800">{formatDate(doc.issuedAt)}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Expiry Date</span>
          <span className="font-semibold text-slate-800">{formatDate(doc.expiresAt)}</span>
        </div>
      </div>

      {doc.fileUrl ? (
        <div className="relative group w-full h-48 bg-slate-50 border border-[#e8ecf1] rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
          <img
            src={doc.fileUrl}
            alt={getDocTypeName(doc.documentType)}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition duration-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => setZoomedImage(doc.fileUrl)}
              className="w-8 h-8 bg-black/65 hover:bg-[#1a56b4] text-white hover:text-black rounded-lg transition shadow-lg flex items-center justify-center cursor-pointer border border-[var(--color-border)]"
              title="Zoom Document"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 bg-black/65 hover:bg-[#1a56b4] text-white hover:text-black rounded-lg transition shadow-lg flex items-center justify-center border border-[var(--color-border)]"
              title="Preview in New Tab"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : (
        <div className="w-full h-48 bg-slate-50 border border-dashed border-[#e8ecf1] rounded-xl flex items-center justify-center text-xs text-slate-500 italic">
          No Document File Uploaded
        </div>
      )}

      <div className="border-t border-[#e8ecf1] pt-3 mt-1 flex flex-col gap-2">
        {rejectingDocId === doc._id ? (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400 font-semibold uppercase">Rejection Reason</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Blurred photo, expired date..."
                value={docRejectReasonInput}
                onChange={(e) => setDocRejectReasonInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-[#e8ecf1] rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                required
              />
              <button
                onClick={() => {
                  if (!docRejectReasonInput.trim()) {
                    toast.error('Please enter a rejection reason.');
                    return;
                  }
                  handleVerifyDocument(doc._id, 'rejected', docRejectReasonInput);
                }}
                className="px-3 py-1.5 bg-red-500 text-white font-bold text-xs rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setRejectingDocId(null);
                  setDocRejectReasonInput('');
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100/80 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <div>
              {doc.verificationStatus === 'verified' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </span>
              ) : doc.verificationStatus === 'rejected' ? (
                <div className="text-red-400 font-semibold">
                  <span className="block">Rejected</span>
                  <span className="text-[10px] text-slate-500 font-normal block max-w-[200px] truncate" title={doc.rejectionReason}>
                    Reason: {doc.rejectionReason || 'N/A'}
                  </span>
                </div>
              ) : (
                <span className="text-amber-400 font-bold">Pending Review</span>
              )}
            </div>

            {mode !== 'verified' && (
              <div className="flex gap-2">
                {doc.verificationStatus !== 'verified' && (
                  <button
                    onClick={() => handleVerifyDocument(doc._id, 'verified')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Approve
                  </button>
                )}
                {doc.verificationStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectingDocId(doc._id);
                      setDocRejectReasonInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Top action block: Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone or guard ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e8ecf1] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a56b4] transition"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Total Records: {filteredData.length}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="neo-flat overflow-hidden border border-[#e8ecf1]">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a56b4]" />
            <span className="text-xs text-slate-500">Fetching records...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 italic">
            No records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf1] bg-slate-50 text-slate-400 font-semibold">
                  <th className="p-4 text-xs uppercase tracking-wider">Name / Contact</th>
                  {mode !== 'clients' && <th className="p-4 text-xs uppercase tracking-wider">Guard ID</th>}
                  {mode === 'clients' && <th className="p-4 text-xs uppercase tracking-wider">Client ID</th>}
                  {mode === 'clients' && <th className="p-4 text-xs uppercase tracking-wider">Status</th>}
                  {mode === 'verified' && <th className="p-4 text-xs uppercase tracking-wider">Nationality</th>}
                  {mode === 'verified' && <th className="p-4 text-xs uppercase tracking-wider">Experience</th>}
                  {mode === 'review' && <th className="p-4 text-xs uppercase tracking-wider">Status</th>}
                  {mode === 'review' && <th className="p-4 text-xs uppercase tracking-wider">Submitted Date</th>}
                  {mode === 'training' && <th className="p-4 text-xs uppercase tracking-wider">Training Name</th>}
                  {mode === 'training' && <th className="p-4 text-xs uppercase tracking-wider">Start Date</th>}
                  {mode === 'training' && <th className="p-4 text-xs uppercase tracking-wider">Certificate Status</th>}
                  <th className="p-4 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf1]">
                {filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{item.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.email}</div>
                      <div className="text-xs text-slate-500">{item.phone || 'No phone'}</div>
                    </td>

                    {mode !== 'clients' && (
                      <td className="p-4">
                        <span className="text-xs font-mono font-bold text-[#1a56b4] uppercase">
                          {item.profile?.guardId || item.guardId || 'PENDING'}
                        </span>
                      </td>
                    )}

                    {mode === 'clients' && (
                      <td className="p-4">
                        <span className="text-xs font-mono font-bold text-[#1a56b4] uppercase">
                          {item.clientId || '—'}
                        </span>
                      </td>
                    )}

                    {mode === 'clients' && (
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    )}

                    {mode === 'verified' && (
                      <td className="p-4 text-slate-600 font-medium">
                        {item.profile?.nationality || 'N/A'}
                      </td>
                    )}

                    {mode === 'verified' && (
                      <td className="p-4 text-slate-600 font-medium">
                        {item.profile?.yearsOfExperience ?? 0} Years
                      </td>
                    )}

                    {mode === 'review' && (
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${item.verificationStatus === 'partially_rejected'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                          {item.verificationStatus === 'partially_rejected' ? 'partially rejected' : 'completed'}
                        </span>
                      </td>
                    )}

                    {mode === 'review' && (
                      <td className="p-4 text-slate-600">
                        {item.verification?.submittedAt
                          ? new Date(item.verification.submittedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    )}

                    {mode === 'training' && (
                      <td className="p-4 text-slate-600 font-medium">
                        {item.profile?.training?.name || 'N/A'}
                      </td>
                    )}

                    {mode === 'training' && (
                      <td className="p-4 text-slate-600 font-medium">
                        {item.profile?.training?.startDate
                          ? new Date(item.profile.training.startDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    )}

                    {mode === 'training' && (
                      <td className="p-4">
                        {(() => {
                          const active = item.trainings?.find(t => 
                            t.status === 'scheduled' || 
                            t.status === 'in_progress' || 
                            t.status === 'certificate_submitted' || 
                            t.status === 'failed' || 
                            t.status === 'completed'
                          ) || item.trainings?.[0];

                          if (!active?.certificateUrl) {
                            return <span className="text-xs text-slate-500 italic">Not Uploaded</span>;
                          }

                          const certStatus = active.certificateStatus || 'pending';

                          return (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              certStatus === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : certStatus === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {certStatus}
                            </span>
                          );
                        })()}
                      </td>
                    )}

                    <td className="p-4 text-right">
                      {mode === 'review' && (
                        <button
                          onClick={() => {
                            setSelectedGuard(item);
                            fetchGuardDetails(item._id);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#1a56b4] text-[#1a56b4] hover:text-white text-xs font-bold transition cursor-pointer"
                        >
                          Review Application
                        </button>
                      )}

                      {mode === 'clients' && (
                        <button
                          onClick={() => handleToggleClientStatus(item._id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ml-auto ${item.status === 'active'
                            ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white'
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                          {item.status === 'active' ? (
                            <>
                              <UserMinus size={14} />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={14} />
                              <span>Reactivate</span>
                            </>
                          )}
                        </button>
                      )}

                      {mode === 'verified' && (
                        <div className="flex items-center gap-3.5 justify-end">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle size={14} />
                            <span>Active Guard</span>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedGuard(item);
                              fetchGuardDetails(item._id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1a56b4] text-xs font-bold transition cursor-pointer"
                          >
                            View Profile
                          </button>
                        </div>
                      )}

                      {mode === 'training' && (
                        <div className="flex items-center gap-3.5 justify-end">

                          <button
                            onClick={() => {
                              setSelectedGuard(item);
                              fetchGuardDetails(item._id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1a56b4] text-xs font-bold transition cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-[#e8ecf1] rounded-2xl p-6 md:p-8 shadow-[var(--shadow-card)] space-y-6 my-8 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e8ecf1] pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {mode === 'verified' ? 'Guard Profile Details' : mode === 'training' ? 'Guard Training Details' : 'Verify Guard Application'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold text-[#1a56b4]">
                  Candidate ID: {selectedGuard.profile?.guardId || selectedGuard.guardId || 'Pending Assignment'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedGuard(null);
                  setGuardDetails(null);
                  setRejecting(false);
                  setRejectionReason('');
                  setActionError('');
                }}
                className="text-slate-400 hover:text-[var(--color-text-primary)] p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {modalLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a56b4]" />
                <span className="text-xs text-slate-500">Loading complete guard dossier...</span>
              </div>
            ) : !guardDetails ? (
              <div className="py-12 text-center text-sm text-slate-500 italic">
                Could not load detailed data.
              </div>
            ) : (
              <>
                {mode === 'training' ? (
                  /* Training Guard Details - Show ONLY the training details! */
                  <div className="space-y-4">
                    {guardDetails.trainings && guardDetails.trainings.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-[#1a56b4] uppercase tracking-wider">Training History ({guardDetails.trainings.length})</h4>
                        
                        {guardDetails.trainings.map((t) => (
                          <div key={t._id} className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-4">
                            <div className="flex items-center justify-between border-b border-[#e8ecf1] pb-2">
                              <span className="font-bold text-slate-800 text-base">{t.trainingName}</span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                                t.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : t.status === 'failed' || t.status === 'cancelled'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {t.status?.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-500 block">Location</span>
                                <span className="text-[var(--color-text-primary)] font-medium">{t.location || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Start Date</span>
                                <span className="text-[var(--color-text-primary)] font-medium">
                                  {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">End Date</span>
                                <span className="text-[var(--color-text-primary)] font-medium">
                                  {t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              {t.score !== null && (
                                <div>
                                  <span className="text-slate-500 block">Score</span>
                                  <span className="text-[var(--color-text-primary)] font-medium">{t.score}</span>
                                </div>
                              )}
                              {t.completedAt && (
                                <div>
                                  <span className="text-slate-500 block">Completed At</span>
                                  <span className="text-[var(--color-text-primary)] font-medium">
                                    {new Date(t.completedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            {t.remarks && (
                              <div className="border-t border-[#e8ecf1] pt-2 mt-2">
                                <span className="text-[10px] text-slate-500 block">Remarks</span>
                                <span className="text-xs text-slate-600 font-medium">{t.remarks}</span>
                              </div>
                            )}

                            {t.certificateUrl && (
                              <div className="border-t border-[#e8ecf1] pt-4 mt-2">
                                <span className="text-[10px] text-slate-500 block mb-1.5">Submitted Training Certificate</span>
                                <div className="relative group rounded-xl overflow-hidden border border-[#e8ecf1] max-w-sm">
                                  <img src={t.certificateUrl} alt="Certificate" className="w-full h-auto object-cover max-h-48" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                                    <a
                                      href={t.certificateUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-[#1a56b4] hover:underline font-semibold"
                                    >
                                      <ExternalLink size={14} />
                                      <span>View Full Document</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      guardDetails.profile?.training?.name ? (
                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-4">
                          <h4 className="text-sm font-bold text-[#1a56b4] uppercase tracking-wider">Training Parameters</h4>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block">Training Name</span>
                              <span className="text-[var(--color-text-primary)] font-medium">{guardDetails.profile.training.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Location</span>
                              <span className="text-[var(--color-text-primary)] font-medium">{guardDetails.profile.training.location || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Start Date</span>
                              <span className="text-[var(--color-text-primary)] font-medium">
                                {guardDetails.profile.training.startDate 
                                  ? new Date(guardDetails.profile.training.startDate).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">End Date</span>
                              <span className="text-[var(--color-text-primary)] font-medium">
                                {guardDetails.profile.training.endDate 
                                  ? new Date(guardDetails.profile.training.endDate).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-sm text-slate-500 italic">
                          No training parameters or history found for this guard.
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <>
                    {/* Step progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                        {VERIFY_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const isActive = activeModalStep === step.id;
                          const isDone = activeModalStep > step.id;
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => goToModalStep(step.id)}
                              className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                isActive
                                  ? 'bg-[#1a56b4]/10 border-[#1a56b4] text-[#1a56b4]'
                                  : isDone
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                    : 'bg-slate-50 border-[#e8ecf1] text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isActive
                                  ? 'bg-[#1a56b4] text-white'
                                  : isDone
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-500'
                              }`}>
                                {isDone ? '✓' : step.id}
                              </span>
                              <Icon size={14} />
                              <span className="hidden sm:inline">{step.label}</span>
                              {idx < VERIFY_STEPS.length - 1 && (
                                <span className="hidden md:inline text-slate-300 ml-1">›</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Step {activeModalStep} of {VERIFY_STEPS.length}: {VERIFY_STEPS[activeModalStep - 1]?.label}
                      </p>
                    </div>

                    {/* Step 1: Address */}
                    {activeModalStep === 1 && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-4 text-sm">
                        <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider flex items-center gap-2">
                          <MapPin size={14} /> Residential Address
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block">Address Line 1</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.addressLine1 || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Address Line 2</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.addressLine2 || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">City</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.city || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Region</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.region || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Country</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.country || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Postal Code</span>
                            <span className="text-slate-800 font-medium">{guardDetails.address?.postalCode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Profile */}
                    {activeModalStep === 2 && (
                      <div className="space-y-4 text-sm">
                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-4">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> Personal & Guard Profile
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block">Full Name</span>
                              <span className="text-slate-800 font-medium">{guardDetails.fullName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Email</span>
                              <span className="text-slate-800 font-medium break-all">{guardDetails.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Phone</span>
                              <span className="text-slate-800 font-medium">{guardDetails.phone || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Date of Birth</span>
                              <span className="text-slate-800 font-medium">{formatDate(guardDetails.profile?.dateOfBirth)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Nationality</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.nationality || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Gender</span>
                              <span className="text-slate-800 capitalize font-medium">{guardDetails.profile?.gender || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Religion</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.religion || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Marital Status</span>
                              <span className="text-slate-800 capitalize font-medium">{guardDetails.profile?.maritalStatus || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Experience</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.yearsOfExperience ?? 0} Years</span>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                              <span className="text-slate-500 block">Languages</span>
                              <span className="text-slate-800 font-medium">
                                {guardDetails.profile?.languages?.length
                                  ? guardDetails.profile.languages.join(', ')
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                              <span className="text-slate-500 block">Bio</span>
                              <span className="text-slate-800 font-medium whitespace-pre-wrap">
                                {guardDetails.profile?.bio || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-3">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider">Education</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block">Level</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.education?.level || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Institution</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.education?.institution || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Qualification</span>
                              <span className="text-slate-800 font-medium">{guardDetails.profile?.education?.qualification || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Years</span>
                              <span className="text-slate-800 font-medium">
                                {guardDetails.profile?.education?.yearStarted || guardDetails.profile?.education?.yearCompleted
                                  ? `${guardDetails.profile?.education?.yearStarted || '—'} – ${guardDetails.profile?.education?.yearCompleted || '—'}`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Documents */}
                    {activeModalStep === 3 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} /> Identity & Supporting Documents
                          </h4>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {guardDetails.documents?.length || 0} file(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {guardDetails.documents && guardDetails.documents.length > 0 ? (
                            guardDetails.documents.map((doc) => renderDocumentCard(doc))
                          ) : (
                            <div className="col-span-2 text-center py-12 text-sm text-slate-500 italic">
                              No documents have been uploaded by this candidate.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Verification */}
                    {activeModalStep === 4 && (
                      <div className="space-y-4 text-sm">
                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-4">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} /> Physical Specifications
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block">Height</span>
                              <span className="text-slate-800 font-medium">
                                {guardDetails.verification?.heightCm ? `${guardDetails.verification.heightCm} cm` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Weight</span>
                              <span className="text-slate-800 font-medium">
                                {guardDetails.verification?.weightKg ? `${guardDetails.verification.weightKg} kg` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">BMI</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.bmi || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">SSNIT Number</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.ssnitNumber || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-3">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider">Payout Details</h4>
                          {guardDetails.verification?.paymentDetails?.paymentMethod ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-500 block">Method</span>
                                <span className="text-slate-800 font-medium capitalize">
                                  {guardDetails.verification.paymentDetails.paymentMethod?.replace('_', ' ')}
                                </span>
                              </div>
                              {guardDetails.verification.paymentDetails.paymentMethod === 'mobile_money' ? (
                                <>
                                  <div>
                                    <span className="text-slate-500 block">Provider</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.mobileMoneyProvider || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">MoMo Number</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.mobileMoneyNumber || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Account Name</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.mobileMoneyAccountName || 'N/A'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-slate-500 block">Bank</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.bankName || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Account Name</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.accountName || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Account Number</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.accountNumber || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Branch</span>
                                    <span className="text-slate-800 font-medium">
                                      {guardDetails.verification.paymentDetails.branchName || 'N/A'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not set</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-3 text-xs">
                            <h5 className="font-bold text-[#1a56b4] uppercase tracking-wider">Next of Kin</h5>
                            <div>
                              <span className="text-slate-500 block">Full Name</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.nextOfKin?.fullName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Relationship</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.nextOfKin?.relationship || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Phone</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.nextOfKin?.phone || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Address</span>
                              <span className="text-slate-800 font-medium">{formatAddress(guardDetails.verification?.nextOfKin?.address)}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-3 text-xs">
                            <h5 className="font-bold text-[#1a56b4] uppercase tracking-wider">Guarantor</h5>
                            <div>
                              <span className="text-slate-500 block">Full Name</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.guarantor?.fullName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Relationship</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.guarantor?.relationship || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Phone</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.guarantor?.phone || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Occupation</span>
                              <span className="text-slate-800 font-medium">{guardDetails.verification?.guarantor?.occupation || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Address</span>
                              <span className="text-slate-800 font-medium">{formatAddress(guardDetails.verification?.guarantor?.address)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Ghana Card No.</span>
                              <span className="text-slate-800 font-medium">
                                {guardDetails.verification?.guarantor?.ghanaCard?.cardNumber
                                  || guardDetails.verification?.guarantor?.ghanaCardFile?.cardNumber
                                  || 'N/A'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {(() => {
                                const { front, back } = getGuarantorIdImages(guardDetails.verification?.guarantor);
                                return (
                                  <>
                                    {renderIdImage(front, 'ID Front')}
                                    {renderIdImage(back, 'ID Back')}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Review */}
                    {activeModalStep === 5 && (
                      <div className="space-y-4 text-sm">
                        <div className="bg-slate-50 rounded-xl p-5 border border-[#e8ecf1] space-y-3">
                          <h4 className="text-xs font-bold text-[#1a56b4] uppercase tracking-wider flex items-center gap-2">
                            <FileCheck size={14} /> Application Summary
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {[
                              { step: 1, label: 'Address', value: formatAddress(guardDetails.address) },
                              { step: 2, label: 'Profile', value: `${guardDetails.fullName || 'N/A'} · ${guardDetails.profile?.nationality || 'N/A'} · ${guardDetails.profile?.yearsOfExperience ?? 0} yrs exp` },
                              { step: 3, label: 'Documents', value: `${guardDetails.documents?.length || 0} uploaded · ${(guardDetails.documents || []).filter((d) => d.verificationStatus === 'verified').length} approved · ${(guardDetails.documents || []).filter((d) => d.verificationStatus === 'rejected').length} rejected · ${(guardDetails.documents || []).filter((d) => !d.verificationStatus || d.verificationStatus === 'pending').length} pending` },
                              { step: 4, label: 'Verification', value: `SSNIT ${guardDetails.verification?.ssnitNumber || 'N/A'} · Kin ${guardDetails.verification?.nextOfKin?.fullName || 'N/A'} · Guarantor ${guardDetails.verification?.guarantor?.fullName || 'N/A'}` },
                            ].map((item) => (
                              <button
                                key={item.step}
                                type="button"
                                onClick={() => goToModalStep(item.step)}
                                className="text-left p-3 rounded-xl border border-[#e8ecf1] bg-white hover:border-[#1a56b4]/40 transition cursor-pointer"
                              >
                                <span className="text-[10px] font-bold text-[#1a56b4] uppercase tracking-wider block mb-1">
                                  Step {item.step}: {item.label}
                                </span>
                                <span className="text-slate-700 font-medium line-clamp-2">{item.value}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {guardDetails.trainings && guardDetails.trainings.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="font-bold text-[#1a56b4] uppercase tracking-wider text-[10px]">
                              Training History ({guardDetails.trainings.length})
                            </h5>
                            {guardDetails.trainings.map((t) => (
                              <div key={t._id} className="bg-slate-50 rounded-xl p-4 border border-[#e8ecf1] space-y-3">
                                <div className="flex items-center justify-between border-b border-[#e8ecf1] pb-2">
                                  <span className="font-bold text-slate-800 text-sm">{t.trainingName}</span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                                    t.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : t.status === 'failed' || t.status === 'cancelled'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}>
                                    {t.status?.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <span className="text-slate-500 block">Location</span>
                                    <span className="text-slate-800 font-medium">{t.location || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Dates</span>
                                    <span className="text-slate-800 font-medium">
                                      {formatDate(t.startDate)} – {formatDate(t.endDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : guardDetails.profile?.training?.name ? (
                          <div className="bg-slate-50 rounded-xl p-4 border border-[#e8ecf1] space-y-3">
                            <h5 className="font-bold text-[#1a56b4] uppercase tracking-wider text-[10px]">Training Parameters</h5>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-500 block">Training Name</span>
                                <span className="text-slate-800 font-medium">{guardDetails.profile.training.name}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Location</span>
                                <span className="text-slate-800 font-medium">{guardDetails.profile.training.location || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Start Date</span>
                                <span className="text-slate-800 font-medium">{formatDate(guardDetails.profile.training.startDate)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">End Date</span>
                                <span className="text-slate-800 font-medium">{formatDate(guardDetails.profile.training.endDate)}</span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Step navigation */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#e8ecf1]">
                      <button
                        type="button"
                        onClick={() => goToModalStep(activeModalStep - 1)}
                        disabled={activeModalStep <= 1}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[#e8ecf1] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        Back
                      </button>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {VERIFY_STEPS[activeModalStep - 1]?.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => goToModalStep(activeModalStep + 1)}
                        disabled={activeModalStep >= VERIFY_STEPS.length}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1a56b4] text-white hover:bg-[#154a9a] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </>
                )}

                {/* Modal Actions */}
                {mode !== 'verified' && mode !== 'training' && (
                  <div className="border-t border-[#e8ecf1] pt-4 flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-end">
                    {rejecting ? (
                      <div className="w-full flex flex-col gap-2">
                        <label className="text-xs text-slate-400 font-medium ml-1">Rejection Reason</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Explain why this profile is rejected (e.g. invalid SSNIT, blur photo)..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                            required
                          />
                          <button
                            onClick={() => {
                              if (!rejectionReason.trim()) {
                                toast.error('Please enter a rejection reason.');
                                    return;
                              }
                              handleVerify(guardDetails._id, 'rejected', rejectionReason);
                            }}
                            disabled={submittingAction}
                            className="px-4 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition cursor-pointer whitespace-nowrap"
                          >
                            Complete Reject
                          </button>
                          <button
                            onClick={() => {
                              if (!rejectionReason.trim()) {
                                toast.error('Please enter a rejection reason.');
                                    return;
                              }
                              handleVerify(guardDetails._id, 'partially_rejected', rejectionReason);
                            }}
                            disabled={submittingAction}
                            className="px-4 py-2 bg-amber-500 text-slate-800 font-bold text-xs rounded-xl hover:bg-amber-600 transition cursor-pointer whitespace-nowrap"
                          >
                            Partial Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejecting(false);
                              setRejectionReason('');
                            }}
                            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100/80 transition cursor-pointer whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        {!approveVerifyGate.canApprove && (
                          <p className="text-[11px] text-amber-600 font-medium text-right max-w-md">
                            {approveVerifyGate.reason || 'Approve all documents in the Documents step first.'}
                          </p>
                        )}
                        <div className="flex gap-3">
                        <button
                          onClick={() => setRejecting(true)}
                          disabled={submittingAction}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <UserX size={14} />
                          <span>Reject Application</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (!approveVerifyGate.canApprove) {
                              toast.error(approveVerifyGate.reason || 'Approve all documents first.');
                              return;
                            }
                            setSubmittingAction(true);
                            try {
                              const response = await apiRequest(`/admin/users/guards/${guardDetails._id}/check-verify-eligibility`, {
                                method: 'GET'
                              });
                              const eligibility = response?.data || response;
                              if (eligibility && eligibility.eligible) {
                                setVerifyForm({
                                  guardId: guardDetails.profile?.guardId || guardDetails.guardId || '',
                                  grade: 'A',
                                  trainingName: '',
                                  trainingStartDate: '',
                                  trainingEndDate: '',
                                  trainingLocation: ''
                                });
                                setShowVerifyModal(true);
                              } else {
                                toast.error(eligibility?.reason || 'This guard is not eligible for verification.');
                              }
                            } catch (err) {
                              toast.error(err.message || 'Failed to check verification eligibility.');
                            } finally {
                              setSubmittingAction(false);
                            }
                          }}
                          disabled={submittingAction || !approveVerifyGate.canApprove}
                          title={approveVerifyGate.reason || 'Approve & verify application'}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                        >
                          {submittingAction ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          <span>Approve & Verify</span>
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Actions for Training Certificate */}
                {mode === 'training' && (
                  (() => {
                    const activeT = guardDetails.trainings?.find(t => 
                      t.status === 'scheduled' || 
                      t.status === 'in_progress' || 
                      t.status === 'certificate_submitted' || 
                      t.status === 'failed' || 
                      t.status === 'completed'
                    ) || guardDetails.trainings?.[0];

                    if (!activeT || !activeT.certificateUrl || activeT.certificateStatus === 'approved') {
                      return null;
                    }

                    return (
                      <div className="border-t border-[#e8ecf1] pt-4">
                        {rejecting ? (
                          <div className="w-full flex flex-col gap-2">
                            <label className="text-xs text-slate-400 font-medium ml-1">Rejection Reason</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Explain why this certificate is rejected..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                                required
                              />
                              <button
                                onClick={async () => {
                                  if (!rejectionReason.trim()) {
                                    toast.error('Please enter a rejection reason.');
                                    return;
                                  }
                                  setSubmittingAction(true);
                                  try {
                                    await apiRequest(`/admin/users/trainings/${activeT._id}/verify`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ status: 'rejected', rejectionReason })
                                    });
                                    toast.success('Certificate rejected successfully.');
                                    setRejecting(false);
                                    setRejectionReason('');
                                    setSelectedGuard(null);
                                    setGuardDetails(null);
                                    fetchData();
                                  } catch (err) {
                                    toast.error(err.message || 'Operation failed.');
                                  } finally {
                                    setSubmittingAction(false);
                                  }
                                }}
                                disabled={submittingAction}
                                className="px-4 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition cursor-pointer whitespace-nowrap"
                              >
                                Complete Reject
                              </button>
                              <button
                                onClick={() => {
                                  setRejecting(false);
                                  setRejectionReason('');
                                }}
                                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100/80 transition cursor-pointer whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => setRejecting(true)}
                              disabled={submittingAction}
                              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Reject Certificate</span>
                            </button>
                            <button
                              onClick={async () => {
                                setSubmittingAction(true);
                                try {
                                  await apiRequest(`/admin/users/trainings/${activeT._id}/verify`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: 'approved' })
                                  });
                                  toast.success('Certificate approved and guard activated successfully!');
                                  setSelectedGuard(null);
                                  setGuardDetails(null);
                                  fetchData();
                                } catch (err) {
                                  toast.error(err.message || 'Operation failed.');
                                } finally {
                                  setSubmittingAction(false);
                                }
                              }}
                              disabled={submittingAction}
                              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                            >
                              {submittingAction ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserCheck size={14} />
                              )}
                              <span>Approve & Activate Guard</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* Zoomed Image Blur Overlay Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/70 hover:bg-[#1a56b4] text-white hover:text-black rounded-full transition shadow-md cursor-pointer"
            >
              <X size={20} />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Document"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Verify Application Modal Form */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-[#e8ecf1] rounded-2xl p-6 shadow-[var(--shadow-card)] space-y-5 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseVerifyModal}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-[var(--color-text-primary)] rounded-lg bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-400" />
                <span>Verify & Approve Guard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Confirm assigned Guard ID, then set grade and initial training parameters.</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!verifyForm.trainingName.trim()) {
                  toast.error('Training name is required');
                  return;
                }

                const payload = {
                  grade: verifyForm.grade,
                  training: {
                    name: verifyForm.trainingName,
                    location: verifyForm.trainingLocation || null,
                    startDate: verifyForm.trainingStartDate || null,
                    endDate: verifyForm.trainingEndDate || null
                  }
                };

                await handleVerify(guardDetails._id, 'verified', payload);
                handleCloseVerifyModal();
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Guard ID</label>
                <input
                  type="text"
                  readOnly
                  value={verifyForm.guardId || 'Will be assigned on verify'}
                  className="w-full px-3 py-2 bg-slate-100 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 font-mono uppercase cursor-default"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Grade <span className="text-red-500">*</span></label>
                <select
                  value={verifyForm.grade}
                  onChange={(e) => setVerifyForm({ ...verifyForm, grade: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#1a56b4] transition cursor-pointer"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Training Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic Onboarding and Physical Training"
                  value={verifyForm.trainingName}
                  onChange={(e) => setVerifyForm({ ...verifyForm, trainingName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a56b4] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={verifyForm.trainingStartDate}
                    onChange={(e) => setVerifyForm({ ...verifyForm, trainingStartDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#1a56b4] transition cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">End Date (Optional)</label>
                  <input
                    type="date"
                    value={verifyForm.trainingEndDate}
                    onChange={(e) => setVerifyForm({ ...verifyForm, trainingEndDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#1a56b4] transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Training Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Main Training Center HQ"
                  value={verifyForm.trainingLocation}
                  onChange={(e) => setVerifyForm({ ...verifyForm, trainingLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#e8ecf1] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a56b4] transition"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseVerifyModal}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-100/80 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingAction ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCheck size={14} />
                  )}
                  <span>Approve & Verify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
