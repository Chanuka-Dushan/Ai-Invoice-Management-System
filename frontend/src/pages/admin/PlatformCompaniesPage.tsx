import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Users,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { PlatformCompany } from '../../types';
import { format } from 'date-fns';
import { Modal } from '../../components/ui/Modal';

export const PlatformCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/super-admin/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggleStatus = async (company: PlatformCompany) => {
    const nextStatus = !company.isActive;
    const confirmMsg = nextStatus
      ? `Re-activate company "${company.name}"?`
      : `Suspend company "${company.name}"? All company users will be temporarily restricted.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(company.id);
    try {
      await apiClient.patch(`/super-admin/companies/${company.id}/status`, {
        isActive: nextStatus,
      });
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isActive: nextStatus } : c)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update company status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleInspectCompany = async (companyId: string) => {
    try {
      const res = await apiClient.get(`/super-admin/companies/${companyId}`);
      setSelectedCompany(res.data);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch company details');
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.country && c.country.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-rose-600" />
            <span>Tenant Businesses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of all registered organizations and businesses operating on the platform.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name, email, or country..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
            <span className="text-sm font-medium">Loading companies...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No businesses found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Company / Business</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Country & Currency</th>
                  <th className="py-3.5 px-4 text-center">Invoices</th>
                  <th className="py-3.5 px-4 text-center">Members</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: c.brandColor || '#4f46e5' }}
                          className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs shrink-0"
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-400">Created: {format(new Date(c.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <p className="text-slate-900">{c.email}</p>
                      <p className="text-[11px] text-slate-400">{c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : 'No Owner'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800">{c.country || 'N/A'}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                        {c.defaultCurrency}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">
                      {c.stats.invoicesCount}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">
                      {c.stats.membersCount}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{c.isActive ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleInspectCompany(c.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        disabled={actionLoadingId === c.id}
                        onClick={() => handleToggleStatus(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          c.isActive
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {c.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Company Modal */}
      {selectedCompany && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Company Details: ${selectedCompany.name}`}
          subtitle={`Inspect organization profile, members, and invoicing data.`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Invoices</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{selectedCompany._count?.invoices || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Customers</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{selectedCompany._count?.customers || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Team Members</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{selectedCompany._count?.members || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Suppliers</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{selectedCompany._count?.suppliers || 0}</p>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Authorized Members</h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {selectedCompany.members?.map((m: any) => (
                  <div key={m.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        {m.user.firstName} {m.user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{m.user.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

