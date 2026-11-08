import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileDown,
  Users,
  Truck,
  Package,
  CreditCard,
  BarChart3,
  Sparkles,
  Building,
  User as UserIcon,
  PlusCircle,
  ShieldAlert,
  Building2,
  Activity,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, activeCompany } = useAuth();
  const navigate = useNavigate();

  const businessNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Invoices', path: '/invoices', icon: FileText },
    { label: 'Incoming Invoices', path: '/incoming-invoices', icon: FileDown },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Suppliers', path: '/suppliers', icon: Truck },
    { label: 'Products & Services', path: '/products', icon: Package },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'AI' },
    { label: 'Company Settings', path: '/settings', icon: Building },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  const adminNavItems = [
    { label: 'Platform Overview', path: '/admin', icon: Activity },
    { label: 'Tenant Companies', path: '/admin/companies', icon: Building2 },
    { label: 'Platform Users', path: '/admin/users', icon: Users },
    { label: 'System Audit Logs', path: '/admin/audit-logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
            Invoice<span className="text-indigo-400">AI</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">
            SaaS Platform
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/invoices/new')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {businessNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-500/30 text-indigo-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Super Admin Section (Only visible to Platform Super Admins) */}
        {user?.isSuperAdmin && (
          <div className="pt-4 mt-3 border-t border-slate-800/80 space-y-1">
            <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Platform Admin</span>
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-300/70 hover:text-rose-200 hover:bg-rose-950/40'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Active Business Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/60 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-700/50">
            {activeCompany?.name ? activeCompany.name.slice(0, 2) : 'CO'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">{activeCompany?.name || 'My Business'}</p>
            <p className="text-[10px] text-slate-400 truncate">{activeCompany?.defaultCurrency || 'USD'} Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

