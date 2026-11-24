import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { PlatformCustomer } from '../../types';
import { format } from 'date-fns';

export const PlatformCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<PlatformCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/super-admin/customers', {
        params: search ? { search } : undefined,
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load platform customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredCustomers = customers.filter((c) => {
    if (filterType === 'ALL') return true;
    return c.type === filterType;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Cross-Tenant CRM
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Customers Directory</h1>
          <p className="text-sm text-slate-500">
            Inspect all client accounts across all tenant businesses, track invoice volume, and view debtor balances.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, email, company, tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Types ({customers.length})</option>
            <option value="BUSINESS">Business Clients</option>
            <option value="INDIVIDUAL">Individual Clients</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            No customer accounts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Customer & Entity</th>
                  <th className="px-5 py-3.5">Tenant Organization</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5 text-center">Invoices</th>
                  <th className="px-5 py-3.5 text-right">Invoiced Total</th>
                  <th className="px-5 py-3.5 text-right">Outstanding</th>
                  <th className="px-5 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                      {cust.companyName && (
                        <div className="text-slate-500 text-[11px]">{cust.companyName}</div>
                      )}
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {cust.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {cust.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{cust.company.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Tenant</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.address && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{cust.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full font-bold text-slate-700 font-mono text-[11px]">
                        {cust.invoicesCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                      {cust.company?.defaultCurrency || '$'} {cust.totalInvoiced.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span className={cust.totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {cust.company?.defaultCurrency || '$'} {cust.totalOutstanding.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {format(new Date(cust.createdAt), 'MMM dd, yyyy')}
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
