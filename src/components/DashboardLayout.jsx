import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { getAdminUser, removeAuthToken, removeAdminUser } from '../services/api.js';
import {
  Users,
  ShieldCheck,
  FileSearch,
  UserCog,
  LogOut,
  Menu,
  X,
  Lock,
  User as UserIcon,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getAdminUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Redirect to login if token is missing
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    removeAuthToken();
    removeAdminUser();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/users/verified-guards':
        return 'Verified Guards';
      case '/users/under-review':
        return 'Applications Under Review';
      case '/users/under-training':
        return 'Guards Under Training';
      case '/users/clients':
        return 'Client Accounts Management';
      default:
        return 'Admin Dashboard';
    }
  };

  const sidebarLinks = [
    {
      to: '/users/verified-guards',
      label: 'Verified Guards',
      icon: ShieldCheck,
    },
    {
      to: '/users/under-review',
      label: 'Under Review',
      icon: FileSearch,
    },
    {
      to: '/users/under-training',
      label: 'Under Training',
      icon: GraduationCap,
    },
    {
      to: '/users/clients',
      label: 'Client Management',
      icon: UserCog,
    },
  ];

  return (
    <div className="min-h-screen bg-[#131720] text-slate-200 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="w-full h-16 bg-[#1e222a] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-white/5 shadow-md">
        
        {/* Left side: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/users/verified-guards" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CC9933]/15 text-[#CC9933] border border-[#CC9933]/30">
              <Lock size={16} />
            </span>
            <span className="text-lg font-bold text-white tracking-wide">
              Watchman<span className="text-[#CC9933]">247</span>
              <span className="ml-1.5 text-[10px] font-semibold bg-[#CC9933]/10 text-[#CC9933] px-2 py-0.5 rounded-full border border-[#CC9933]/10 uppercase tracking-widest">
                Admin
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Page Title */}
        <h2 className="hidden md:block text-sm font-bold text-white tracking-wide uppercase">
          {getPageTitle()}
        </h2>

        {/* Right side: Admin Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 py-1.5 px-3 hover:bg-white/5 rounded-xl transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#CC9933]/20 border border-[#CC9933]/30 flex items-center justify-center text-[#CC9933]">
              <UserIcon size={16} />
            </div>
            <span className="text-sm font-medium text-white hidden sm:block">
              {admin?.fullName || 'Administrator'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1e222a] border border-white/5 rounded-xl shadow-2xl py-2 pl-2 pr-2 animate-in fade-in duration-150 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{admin?.email || 'admin@watchman247.com'}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition cursor-pointer text-left"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="flex flex-1 relative">
        
        {/* Sidebar Container */}
        <aside
          className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#1e222a] border-r border-white/5 flex flex-col justify-between py-6 z-30 transition-transform duration-300 lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Top navigation block */}
          <div className="space-y-6 px-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-3 mb-2">
                User Management
              </span>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? 'bg-[#CC9933]/10 text-[#CC9933] border border-[#CC9933]/20 shadow-[0_4px_12px_rgba(204,153,51,0.05)] font-bold'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer block */}
          <div className="px-4 border-t border-white/5 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-sm font-medium transition cursor-pointer text-left"
            >
              <LogOut size={18} />
              <span>Logout Session</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Backdrop Overlay on Mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden mt-16"
          ></div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
