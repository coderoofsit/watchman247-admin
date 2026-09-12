import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getAdminUser, removeAuthToken, removeAdminUser } from '../services/api.js';
import {
  Home,
  LayoutDashboard,
  Users,
  User,
  FileBadge,
  Shield,
  CalendarDays,
  Receipt,
  Mail,
  MessagesSquare,
  LifeBuoy,
  FileText,
  Settings,
  ShieldCheck,
  FileSearch,
  GraduationCap,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  Search,
  Globe,
  MessageCircle,
  Bell,
} from 'lucide-react';
import logo from '../assets/logo.png';

const GUARD_CHILD_PATHS = [
  '/users/verified-guards',
  '/users/under-review',
  '/users/under-training',
];

const sidebarLinks = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Guards',
    icon: Users,
    children: [
      { to: '/users/verified-guards', label: 'Verified Guards', icon: ShieldCheck },
      { to: '/users/under-review', label: 'Under Review', icon: FileSearch },
      { to: '/users/under-training', label: 'Under Training', icon: GraduationCap },
    ],
  },
  { to: '/users/clients', label: 'Clients', icon: User },
  { to: '/users/under-training', label: 'Training & Certification', icon: FileBadge },
  { to: '/live-guard-service', label: 'Live Guard Service', icon: Shield },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/inbox', label: 'Inbox', icon: Mail },
  { to: '/chat-room', label: 'Chat Room', icon: MessagesSquare },
  { to: '/help-center', label: 'Help Center', icon: LifeBuoy },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function navItemClass(isActive) {
  return `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
    isActive
      ? 'bg-white/15 text-white before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getAdminUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [guardsOpen, setGuardsOpen] = useState(() =>
    GUARD_CHILD_PATHS.includes(location.pathname),
  );

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (GUARD_CHILD_PATHS.includes(location.pathname)) {
      setGuardsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    removeAuthToken();
    removeAdminUser();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/home':
        return 'Home';
      case '/dashboard':
        return 'Dashboard';
      case '/users/verified-guards':
        return 'Verified Guards';
      case '/users/under-review':
        return 'Applications Under Review';
      case '/users/under-training':
        return 'Training & Certification';
      case '/users/clients':
        return 'Clients';
      case '/live-guard-service':
        return 'Live Guard Service';
      case '/calendar':
        return 'Calendar';
      case '/invoices':
        return 'Invoices';
      case '/inbox':
        return 'Inbox';
      case '/chat-room':
        return 'Chat Room';
      case '/help-center':
        return 'Help Center';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings';
      case '/complaints':
        return 'Inbox';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[var(--color-sidebar)] text-white flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-white/10">
          <img src={logo} alt="Watchman 247" className="h-10 w-10 rounded-full object-cover bg-white/10" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-wide truncate">WATCHMAN</p>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Admin</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
            type="button"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-3 py-5 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;

              if (link.children) {
                const childActive = link.children.some((c) => location.pathname === c.to);
                return (
                  <div key={link.label}>
                    <button
                      type="button"
                      onClick={() => setGuardsOpen((open) => !open)}
                      className={`w-full ${navItemClass(childActive)}`}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                      <span className="flex-1 text-left">{link.label}</span>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        className={`shrink-0 transition-transform ${guardsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {guardsOpen && (
                      <div className="mt-1 ml-3 space-y-1 border-l border-white/10 pl-2">
                        {link.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              end
                              onClick={() => setIsSidebarOpen(false)}
                              className={({ isActive }) => navItemClass(isActive)}
                            >
                              <ChildIcon size={16} strokeWidth={1.75} />
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={`${link.label}-${link.to}`}
                  to={link.to}
                  end
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition cursor-pointer text-left"
            type="button"
          >
            <LogOut size={18} strokeWidth={1.75} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full h-16 bg-[var(--color-header)] flex items-center justify-between gap-4 px-4 md:px-6 sticky top-0 z-20 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
              type="button"
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>

            <div className="relative hidden sm:block flex-1 max-w-xl">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Guards, Customers, Transactions, invoices or help"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-blue)] focus:ring-1 focus:ring-[var(--color-blue)]/30"
              />
            </div>

            <h2 className="sm:hidden text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              className="hidden md:inline-flex p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
              aria-label="Language"
            >
              <Globe size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="hidden md:inline-flex p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
              aria-label="Messages"
            >
              <MessageCircle size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-gold)]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-[var(--color-bg)] rounded-lg transition cursor-pointer"
                type="button"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)] hidden sm:block">
                  {admin?.fullName || 'Administrator'}
                </span>
                <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
                <div className="w-9 h-9 rounded-full bg-[var(--color-blue)]/10 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-blue)]">
                  <UserIcon size={16} strokeWidth={1.75} />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-card)] py-2 pl-2 pr-2 z-50">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1.5">
                    <p className="text-xs text-[var(--color-text-secondary)]">Signed in as</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {admin?.email || 'admin@watchman247.com'}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition cursor-pointer text-left"
                    type="button"
                  >
                    <LogOut size={16} strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
