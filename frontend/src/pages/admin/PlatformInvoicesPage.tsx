import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Building2,
  Calendar,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { PlatformInvoice } from '../../types';
import { format } from 'date-fns';
import { downloadInvoicePdf } from '../../api/pdf';

export const PlatformInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/super-admin/invoices', {
        params: {
          search: search || undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        },
      });
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load platform invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ISSUED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Global Billing Overview
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cross-Tenant Invoices</h1>
          <p className="text-sm text-slate-500">
            Monitor real-time billing activity, overdue balances, and invoice records across all tenant businesses.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by invoice #, client, tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            No invoices found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Tenant Organization</th>
                  <th className="px-5 py-3.5">Customer / Debtor</th>
                  <th className="px-5 py-3.5">Issue & Due Date</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {inv.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{inv.company.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Tenant</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{inv.customer?.name}</div>
                      {inv.customer?.email && (
                        <div className="text-[11px] text-slate-400">{inv.customer.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                      <div>Issued: {format(new Date(inv.issueDate), 'MMM dd, yyyy')}</div>
                      <div className="text-[11px] text-slate-400">
                        Due: {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        {inv.currency} {inv.totalAmount.toLocaleString()}
                      </div>
                      {inv.outstandingBalance > 0 && (
                        <div className="text-[10px] font-mono text-rose-600">
                          Due: {inv.currency} {inv.outstandingBalance.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => downloadInvoicePdf(inv.id, inv.invoiceNumber)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors mr-1"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
