import React, { useState } from 'react';
import { Building2, ChevronDown, LogOut, Plus, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../api/client';

export const Navbar: React.FC = () => {
  const { user, activeCompany, companies, switchCompany, logout, refreshUserAndCompanies } = useAuth();
  const navigate = useNavigate();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);

  // New Company Form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyCurrency, setNewCompanyCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/companies', {
        name: newCompanyName.trim(),
        email: newCompanyEmail.trim() || user?.email,
        defaultCurrency: newCompanyCurrency,
      });
      await refreshUserAndCompanies();
      setIsNewCompanyModalOpen(false);
      setNewCompanyName('');
      setNewCompanyEmail('');
    } catch (err) {
      console.error('Failed to create company:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20">
        {/* Left: Company Selector */}
        <div className="relative">
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-800"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold max-w-[160px] sm:max-w-[200px] truncate">
              {activeCompany?.name || 'Select Company'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isCompanyDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Business
              </div>
              {companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    switchCompany(comp.id);
                    setIsCompanyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${
                    comp.id === activeCompany?.id ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{comp.name}</span>
                  <span className="text-xs text-slate-400 uppercase">{comp.defaultCurrency}</span>
                </button>
              ))}
              <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                <button
                  onClick={() => {
                    setIsCompanyDropdownOpen(false);
                    setIsNewCompanyModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Business
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick actions & User menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai-assistant')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Financial Assistant</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden sm:inline-block">
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Business Settings</span>
                </button>
                {user?.isSuperAdmin && (
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>Super Admin Console</span>
                  </button>
                )}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New Company Modal */}
      <Modal
        isOpen={isNewCompanyModalOpen}
        onClose={() => setIsNewCompanyModalOpen(false)}
        title="Add New Business Profile"
        subtitle="Manage multiple businesses or ventures under a single InvoiceAI account."
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g. Acme Creative Studios"
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Business Email *
            </label>
            <input
              type="email"
              required
              value={newCompanyEmail}
              onChange={(e) => setNewCompanyEmail(e.target.value)}
              placeholder="billing@acme.com"
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Currency
            </label>
            <select
              value={newCompanyCurrency}
              onChange={(e) => setNewCompanyCurrency(e.target.value)}
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="USD">USD ($)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AUD">AUD ($)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewCompanyModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

