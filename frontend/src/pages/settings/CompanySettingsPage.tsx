import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  DollarSign,
  Palette,
  CreditCard,
  FileText,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Company } from '../../types';

export const CompanySettingsPage: React.FC = () => {
  const { activeCompany, updateActiveCompany } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    businessRegNumber: '',
    taxNumber: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    defaultCurrency: 'USD',
    brandColor: '#1e3a8a',
    bankDetails: '',
    defaultPaymentTerms: '',
    defaultInvoiceFooter: '',
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeCompany) {
      setFormData({
        name: activeCompany.name || '',
        email: activeCompany.email || '',
        phone: activeCompany.phone || '',
        website: activeCompany.website || '',
        businessRegNumber: activeCompany.businessRegNumber || '',
        taxNumber: activeCompany.taxNumber || '',
        address1: activeCompany.address1 || '',
        address2: activeCompany.address2 || '',
        city: activeCompany.city || '',
        state: activeCompany.state || '',
        postalCode: activeCompany.postalCode || '',
        country: activeCompany.country || '',
        defaultCurrency: activeCompany.defaultCurrency || 'USD',
        brandColor: activeCompany.brandColor || '#1e3a8a',
        bankDetails: activeCompany.bankDetails || '',
        defaultPaymentTerms: activeCompany.defaultPaymentTerms || '',
        defaultInvoiceFooter: activeCompany.defaultInvoiceFooter || '',
      });
      setLogoUrl(activeCompany.logoUrl || null);
    }
  }, [activeCompany]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const fd = new FormData();
    fd.append('logo', file);

    try {
      const res = await apiClient.post('/companies/active/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data.logoUrl);
      updateActiveCompany({ ...activeCompany!, logoUrl: res.data.logoUrl });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove company logo?')) return;
    try {
      await apiClient.delete('/companies/active/logo');
      setLogoUrl(null);
      updateActiveCompany({ ...activeCompany!, logoUrl: null });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove logo');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const res = await apiClient.put('/companies/active', formData);
      updateActiveCompany(res.data);
      setSuccessMessage('Business profile & invoicing settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          These details automatically populate the header, logo, bank details, and payment instructions of all new invoices.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Logo Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Company Logo</h2>
        <p className="text-xs text-slate-500">
          Upload your brand logo for automatic rendering in invoice templates and PDFs (JPG, PNG, WebP, SVG).
        </p>

        <div className="flex items-center gap-6 pt-2">
          <div className="w-36 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
            {logoUrl ? (
              <img
                src={`http://localhost:4000${logoUrl}`}
                alt="Company Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400 font-semibold text-center">No Logo Uploaded</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition-all"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Business Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Official Business Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Telephone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Business Registration Number
              </label>
              <input
                type="text"
                value={formData.businessRegNumber}
                onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                placeholder="PV-XXXXX"
                className="w-full p-3 text-sm border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tax / VAT Number
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="TIN-XXXXX"
                className="w-full p-3 text-sm border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Physical Address */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Business Address
            </label>
            <input
              type="text"
              placeholder="Address Line 1"
              value={formData.address1}
              onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={formData.address2}
              onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="State / Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Invoicing Defaults */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Invoicing & Payment Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Currency
              </label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="LKR">LKR (Rs)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Brand Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                  className="w-12 h-11 p-1 border border-slate-200 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                  className="w-full p-3 text-sm font-mono border border-slate-200 rounded-xl uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Bank Account Details & Payment Instructions
            </label>
            <textarea
              rows={4}
              value={formData.bankDetails}
              onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
              placeholder="Commercial Bank of Ceylon&#10;Account Name: Apex Digital Solutions&#10;Account No: 1000 8945 1209&#10;SWIFT: CCEYLKLX"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Default Payment Terms
            </label>
            <textarea
              rows={2}
              value={formData.defaultPaymentTerms}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              placeholder="Payment due within 14 days of invoice date."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Default Invoice Footer / Appreciation Message
            </label>
            <input
              type="text"
              value={formData.defaultInvoiceFooter}
              onChange={(e) => setFormData({ ...formData, defaultInvoiceFooter: e.target.value })}
              placeholder="Thank you for your business!"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl font-sans"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

