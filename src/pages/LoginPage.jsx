import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setAuthToken, setAdminUser } from '../services/api.js';
import { ShieldAlert } from 'lucide-react';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please fill in all fields.');
      }

      const response = await apiRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const token = response.data?.token || response.token;
      const role = response.data?.role || response.role;
      const fullName = response.data?.fullName || 'Admin User';

      if (role !== 'admin') {
        throw new Error('Access denied. Non-administrator account.');
      }

      if (token) {
        setAuthToken(token);
        setAdminUser({ fullName, email, role });
        navigate('/users/verified-guards');
      } else {
        throw new Error('No authentication token received.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-gradient-to-b from-[#1a1440] via-[#2E2559] to-[#3d2f7a]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="adminWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6B8CFF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9BB0FF" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d="M0,200 C150,120 300,280 450,200 C600,120 700,180 800,140 L800,400 C650,460 500,360 350,420 C200,480 100,400 0,450 Z"
            fill="url(#adminWaveGrad)"
          />
          <path
            d="M0,420 C180,360 320,520 480,440 C640,360 720,420 800,380 L800,650 C640,700 500,600 340,660 C180,720 80,640 0,680 Z"
            fill="url(#adminWaveGrad)"
            opacity="0.7"
          />
          <path
            d="M0,680 C160,620 300,760 460,700 C620,640 720,700 800,660 L800,900 L0,900 Z"
            fill="url(#adminWaveGrad)"
            opacity="0.5"
          />
          <circle cx="180" cy="220" r="6" fill="white" opacity="0.45" />
          <circle cx="420" cy="180" r="4" fill="white" opacity="0.35" />
          <circle cx="620" cy="260" r="5" fill="white" opacity="0.4" />
          <circle cx="280" cy="480" r="5" fill="white" opacity="0.35" />
          <circle cx="540" cy="520" r="4" fill="white" opacity="0.3" />
        </svg>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative overflow-hidden">
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto w-[70%] max-w-md opacity-[0.06] object-contain"
        />

        <div className="w-full max-w-[420px] relative z-10">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Watchman 247" className="h-24 w-24 object-contain mb-4" />
            <p className="text-center text-[var(--color-text-secondary)] text-sm">
              Welcome back! Please login to your account.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              Administrative Portal
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="admin-email" className="text-sm font-medium text-[var(--color-text-secondary)]">
                Username
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-transparent border-0 border-b border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-blue)] transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="admin-password" className="text-sm font-medium text-[var(--color-text-secondary)]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-transparent border-0 border-b border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-blue)] transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-blue)] focus:ring-[var(--color-blue)]"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 px-4 bg-[var(--color-blue)] hover:bg-[var(--color-blue-light)] text-white font-semibold text-sm rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[11px] text-[var(--color-text-secondary)]">
            Term of use. Privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
