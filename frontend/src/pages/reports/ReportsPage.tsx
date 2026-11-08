import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { DashboardMetrics } from '../../types';

export const ReportsPage: React.FC = () => {
  const { activeCompany } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [range, setRange] = useState('this_year');

  useEffect(() => {
    if (activeCompany) {
      apiClient.get(`/reports/dashboard?range=${range}`).then((res) => {
        setMetrics(res.data);
      });
    }
  }, [activeCompany, range]);

  const currency = activeCompany?.defaultCurrency || 'USD';
  const formatAmount = (num?: number) => {
    return `${currency} ${(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const downloadInvoicesCsv = () => {
    window.open('http://localhost:4000/reports/export/invoices', '_blank');
  };

  const downloadExpensesCsv = () => {
    window.open('http://localhost:4000/reports/export/expenses', '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download raw CSV audits and analyze financial margins.
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadInvoicesCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            onClick={downloadExpensesCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Expenses CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
          <p className="text-3xl font-black text-slate-900">{formatAmount(metrics?.kpis.totalRevenue)}</p>
          <p className="text-xs text-emerald-600 font-semibold">From {metrics?.kpis.paidInvoicesCount || 0} fully paid invoices</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Vendor Expenses</p>
          <p className="text-3xl font-black text-slate-900">{formatAmount(metrics?.kpis.totalExpenses)}</p>
          <p className="text-xs text-slate-500 font-semibold">Approved supplier bills</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Operating Margin</p>
          <p className={`text-3xl font-black ${(metrics?.kpis.netProfit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatAmount(metrics?.kpis.netProfit)}
          </p>
          <p className="text-xs text-slate-500 font-semibold">Net profit before taxes</p>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Breakdown</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <th className="py-3.5 px-6">Month</th>
              <th className="py-3.5 px-6 text-right">Revenue</th>
              <th className="py-3.5 px-6 text-right">Expenses</th>
              <th className="py-3.5 px-6 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics?.monthlyChart.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-6 font-semibold text-slate-800">{m.month}</td>
                <td className="py-3.5 px-6 text-right font-medium text-emerald-600">
                  +{currency} {m.revenue.toFixed(2)}
                </td>
                <td className="py-3.5 px-6 text-right font-medium text-rose-500">
                  -{currency} {m.expense.toFixed(2)}
                </td>
                <td className="py-3.5 px-6 text-right font-black text-slate-900">
                  {currency} {(m.revenue - m.expense).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

