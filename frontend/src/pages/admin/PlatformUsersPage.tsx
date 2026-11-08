import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Building,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { PlatformUser } from '../../types';
import { format } from 'date-fns';

export const PlatformUsersPage: React.FC = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/super-admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user: PlatformUser) => {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `Re-activate user "${user.name}"?`
      : `Deactivate user "${user.name}"? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await apiClient.patch(`/super-admin/users/${user.id}/status`, {
        isActive: nextStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSuperAdmin = async (user: PlatformUser) => {
    const nextStatus = !user.isSuperAdmin;
    const confirmMsg = nextStatus
      ? `Promote "${user.name}" to Super Admin? They will have full access to all platform data.`
      : `Revoke Super Admin privileges from "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await apiClient.patch(`/super-admin/users/${user.id}/role`, {
        isSuperAdmin: nextStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isSuperAdmin: nextStatus } : u)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update super admin role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.companies.some((c) => c.companyName.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Platform Users</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all registered SaaS accounts, business affiliations, and global administrative privileges.
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
          placeholder="Search by user name, email, or company..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-sm font-medium">Loading platform users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Associated Companies</th>
                  <th className="py-3.5 px-4">Privilege</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Registered: {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <p className="text-slate-900">{u.email}</p>
                      <p className="text-[11px] text-slate-400">{u.phone || 'No phone'}</p>
                    </td>
                    <td className="py-4 px-4">
                      {u.companies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.companies.map((c, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] text-slate-700 font-semibold"
                            >
                              {c.companyName} ({c.role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No Companies</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {u.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] border border-rose-200">
                          <ShieldAlert className="w-3 h-3" /> SUPER ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleToggleSuperAdmin(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          u.isSuperAdmin
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        {u.isSuperAdmin ? 'Revoke Super' : 'Make Super'}
                      </button>
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.isActive
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
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

