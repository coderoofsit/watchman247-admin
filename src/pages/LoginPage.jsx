import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setAuthToken, setAdminUser } from '../services/api.js';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-[#131720] flex items-center justify-center p-4">
      {/* Neumorphic shadow card */}
      <div className="w-full max-w-md bg-[#1e222a] border border-white/5 rounded-2xl p-8 shadow-[10px_10px_30px_rgba(0,0,0,0.5),-10px_-10px_30px_rgba(255,255,255,0.02)] space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CC9933]/10 border border-[#CC9933]/20 text-[#CC9933] shadow-[4px_4px_10px_rgba(0,0,0,0.3)]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide mt-3">
            Watchman<span className="text-[#CC9933]">247</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Administrative Portal
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@watchman247.com"
                className="w-full pl-11 pr-4 py-3 bg-[#131720] border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CC9933] focus:ring-1 focus:ring-[#CC9933] transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 bg-[#131720] border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CC9933] focus:ring-1 focus:ring-[#CC9933] transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#CC9933] hover:bg-[#CC9933]/90 text-black font-bold text-sm rounded-xl shadow-[4px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-none hover:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
