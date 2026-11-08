import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  Download,
  Search,
  Filter,
  Eye,
  Share2,
  FileText,
  CreditCard,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Invoice, InvoiceStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { downloadInvoicePdf } from '../../api/pdf';
import { format } from 'date-fns';

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeCompany } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/invoices', { params });
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchInvoices();
    }
  }, [activeCompany, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleCopyPublicLink = (token: string) => {
    const url = `${window.location.origin}/view-invoice/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleDownloadPdf = (id: string, invNum: string) => {
    downloadInvoicePdf(id, invNum);
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:4000/reports/export/invoices?token=${token}`, '_blank');
  };

  const currency = activeCompany?.defaultCurrency || 'USD';
  const formatAmount = (num?: number) => {
    return `${currency} ${(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, issue, track, and share invoices for {activeCompany?.name}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/invoices/new?mode=ai')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create with AI</span>
          </button>
          <button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DRAFT', label: 'Drafts' },
            { id: 'ISSUED', label: 'Issued' },
            { id: 'PAID', label: 'Paid' },
            { id: 'PARTIALLY_PAID', label: 'Partial' },
            { id: 'OVERDUE', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
          />
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Dates</th>
                <th className="py-3.5 px-6 text-right">Total</th>
                <th className="py-3.5 px-6 text-right">Balance</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Invoice Number */}
                    <td className="py-4 px-6">
                      <div
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                      {inv.isAiGenerated && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-0.5">
                          <Sparkles className="w-3 h-3" /> Generated with AI
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">{inv.customer?.name}</p>
                      {inv.customer?.companyName && (
                        <p className="text-xs text-slate-400">{inv.customer.companyName}</p>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <p>
                        <span className="text-slate-400">Issued:</span> {format(new Date(inv.issueDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="mt-0.5">
                        <span className="text-slate-400">Due:</span> {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      {formatAmount(inv.totalAmount)}
                    </td>

                    {/* Balance */}
                    <td className="py-4 px-6 text-right">
                      <span className={`font-bold text-xs ${inv.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatAmount(inv.outstandingBalance)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center">
                      <Badge variant={inv.status.toLowerCase() as any}>{inv.status}</Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          title="View Invoice"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          title="Download PDF"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyPublicLink(inv.publicToken)}
                          title="Copy Public Link"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative"
                        >
                          {copiedToken === inv.publicToken ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No invoices match your filter. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

