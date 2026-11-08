import React, { useState } from 'react';
import { User, Shield, Building, Key, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { user, companies } = useAuth();
  const [success, setSuccess] = useState(false);

  return (
    <div className="space-y-8 max-w-3xl pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Profile & Access</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal account credentials and business organization access.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            {user?.phone && <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Company Memberships & Roles
          </h3>
          <div className="space-y-2">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-sm text-slate-800">{c.name}</span>
                </div>
                <Badge variant={c.role === 'OWNER' ? 'issued' : 'neutral'}>
                  {c.role || 'MEMBER'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

