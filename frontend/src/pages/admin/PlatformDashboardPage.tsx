import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { PlatformStats } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';

export const PlatformDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/super-admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load platform stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tenant Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Registered Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-violet-600 to-purple-600',
    },
    {
      label: 'Global Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'from-amber-600 to-orange-600',
    },
    {
      label: 'Global Invoiced Volume',
      value: `$${(stats.totalVolume || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-rose-900/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-600/30 text-rose-300 rounded-full text-xs font-black uppercase tracking-wider border border-rose-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Platform Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Global SaaS Management</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Inspect all tenant businesses, oversee registered platform users, monitor AI models, and enforce global security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/companies')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Companies</span>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${kpi.color} text-white flex items-center justify-center shrink-0 shadow-md`}
            >
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns: Recent Companies & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Companies */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Tenant Companies</span>
            </h2>
            <button
              onClick={() => navigate('/admin/companies')}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
            >
              <span>View All ({stats.totalCompanies})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentCompanies.map((comp) => (
              <div
                key={comp.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{comp.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {comp.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {comp.email} • {comp.membersCount} member(s) • {comp.invoicesCount} invoice(s)
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/companies')}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
                  title="Inspect Company"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Registered Platform Users</span>
            </h2>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
            >
              <span>View All ({stats.totalUsers})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {u.firstName} {u.lastName}
                    </p>
                    {u.isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

