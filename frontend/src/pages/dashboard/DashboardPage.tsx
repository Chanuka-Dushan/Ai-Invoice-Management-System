import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Upload,
  UserPlus,
  Truck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { DashboardMetrics, Invoice, Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeCompany } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [filterRange, setFilterRange] = useState<string>('this_month');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async (range: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/dashboard?range=${range}`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchDashboardData(filterRange);
    }
  }, [activeCompany, filterRange]);

  const currency = activeCompany?.defaultCurrency || 'USD';
  const formatAmount = (num?: number) => {
    return `${currency} ${(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time performance metrics and invoice activity for <span className="font-semibold text-slate-800">{activeCompany?.name}</span>
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl w-fit">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_year', label: 'This Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterRange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filterRange === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => navigate('/invoices/new?mode=manual')}
          className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-300"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <span>Create Invoice</span>
        </button>

        <button
          onClick={() => navigate('/invoices/new?mode=ai')}
          className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200 rounded-2xl text-xs font-bold text-indigo-900 shadow-sm transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Create with AI</span>
        </button>

        <button
          onClick={() => navigate('/incoming-invoices')}
          className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-300"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <span>Upload Bill</span>
        </button>

        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-300"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
          <span>Add Customer</span>
        </button>

        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-300 col-span-2 sm:col-span-1"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <span>Add Supplier</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatAmount(metrics?.kpis.totalRevenue)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>Collected from payments</span>
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatAmount(metrics?.kpis.outstandingBalance)}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {metrics?.kpis.unpaidInvoicesCount || 0} unpaid / active invoice(s)
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatAmount(metrics?.kpis.totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            From approved supplier invoices
          </p>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Invoices</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 tracking-tight">
            {metrics?.kpis.overdueInvoicesCount || 0}
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            Invoices past due date
          </p>
        </div>
      </div>

      {/* Monthly Financial Chart (Visual SVG Bar Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue vs Expense Trend</h2>
            <p className="text-xs text-slate-500">6-Month historical income and outgoing expenses</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-indigo-600" /> Revenue
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-rose-400" /> Expenses
            </div>
          </div>
        </div>

        {metrics?.monthlyChart && (
          <div className="h-48 flex items-end justify-between gap-4 pt-6 border-b border-slate-100">
            {metrics.monthlyChart.map((m, idx) => {
              const maxVal = Math.max(
                ...metrics.monthlyChart.map((item) => Math.max(item.revenue, item.expense)),
                100,
              );
              const revHeight = Math.max(8, (m.revenue / maxVal) * 140);
              const expHeight = Math.max(8, (m.expense / maxVal) * 140);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="flex items-end gap-1.5 h-36">
                    <div
                      style={{ height: `${revHeight}px` }}
                      className="w-5 sm:w-8 bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500"
                      title={`Revenue: ${currency} ${m.revenue}`}
                    />
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-5 sm:w-8 bg-rose-400 rounded-t-md transition-all group-hover:bg-rose-500"
                      title={`Expenses: ${currency} ${m.expense}`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate w-full text-center">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Invoices & Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Invoices</h2>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics?.recentInvoices && metrics.recentInvoices.length > 0 ? (
              metrics.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{inv.invoiceNumber}</span>
                      <Badge variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{inv.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-slate-900">{formatAmount(inv.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {format(new Date(inv.issueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent invoices recorded</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Payments</h2>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics?.recentPayments && metrics.recentPayments.length > 0 ? (
              metrics.recentPayments.map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between px-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm text-slate-800">
                        {pay.invoice?.invoiceNumber || 'Direct Payment'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {pay.paymentMethod.replace('_', ' ')} • Ref: {pay.transactionReference || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-emerald-600">+{formatAmount(pay.amount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {format(new Date(pay.paymentDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No payments collected yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

