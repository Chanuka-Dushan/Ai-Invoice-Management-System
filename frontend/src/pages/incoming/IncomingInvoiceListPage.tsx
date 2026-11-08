import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Eye,
  Loader2,
  Trash2,
  Download,
  Building,
  Calendar,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IncomingInvoice, Supplier } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';

export const IncomingInvoiceListPage: React.FC = () => {
  const { activeCompany } = useAuth();
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState<IncomingInvoice | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [reviewSupplierName, setReviewSupplierName] = useState('');
  const [reviewInvoiceNumber, setReviewInvoiceNumber] = useState('');
  const [reviewInvoiceDate, setReviewInvoiceDate] = useState('');
  const [reviewTotalAmount, setReviewTotalAmount] = useState<number>(0);
  const [reviewSubtotal, setReviewSubtotal] = useState<number>(0);
  const [reviewTaxAmount, setReviewTaxAmount] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  const fetchIncomingInvoices = async () => {
    setIsLoading(true);
    try {
      const [invRes, supRes] = await Promise.all([
        apiClient.get('/incoming-invoices'),
        apiClient.get('/suppliers'),
      ]);
      setInvoices(invRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      console.error('Failed to load supplier invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchIncomingInvoices();
    }
  }, [activeCompany]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/incoming-invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setDuplicateWarning(data.isDuplicate);
      openReviewModal(data.incomingInvoice, data.isDuplicate, data.extractedSupplierName);
      fetchIncomingInvoices();
    } catch (err: any) {
      console.error('Bill upload failed:', err);
      setUploadError(err.response?.data?.message || 'Failed to process invoice file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openReviewModal = (inv: IncomingInvoice, isDup = false, extractedSupName?: string) => {
    setCurrentReviewItem(inv);
    setDuplicateWarning(isDup);
    setReviewSupplierName(inv.supplier?.name || extractedSupName || 'Vendor');
    setReviewInvoiceNumber(inv.invoiceNumber || '');
    setReviewInvoiceDate(inv.invoiceDate ? format(new Date(inv.invoiceDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setReviewTotalAmount(Number(inv.totalAmount));
    setReviewSubtotal(Number(inv.subtotal));
    setReviewTaxAmount(Number(inv.taxAmount));
    setReviewNotes(inv.notes || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (newStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW') => {
    if (!currentReviewItem) return;
    setIsSavingReview(true);

    try {
      await apiClient.put(`/incoming-invoices/${currentReviewItem.id}`, {
        supplierName: reviewSupplierName,
        invoiceNumber: reviewInvoiceNumber,
        invoiceDate: reviewInvoiceDate,
        totalAmount: reviewTotalAmount,
        subtotal: reviewSubtotal,
        taxAmount: reviewTaxAmount,
        status: newStatus,
        notes: reviewNotes,
      });

      setIsReviewModalOpen(false);
      fetchIncomingInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update incoming invoice');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this incoming invoice record?')) return;
    try {
      await apiClient.delete(`/incoming-invoices/${id}`);
      fetchIncomingInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const currency = activeCompany?.defaultCurrency || 'USD';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Incoming Invoices & Bills</h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload supplier invoices (PDF, JPG, PNG) for automatic OCR text extraction, duplicate detection, and review.
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {uploadError}
        </div>
      )}

      {/* Drag & Drop Upload Hero Card */}
      <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-4 border border-indigo-900">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Upload className="w-8 h-8" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold">Upload Supplier Bill for AI Extraction</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Accepts PDF, JPG, JPEG, and PNG up to 15MB. The extraction engine extracts supplier name, invoice #, dates, taxes, and totals.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting Document Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Choose Invoice File</span>
            </>
          )}
        </button>
      </div>

      {/* Supplier Invoices List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Processed Supplier Bills</h3>
          <span className="text-xs text-slate-400">{invoices.length} bill(s) recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-6">Supplier</th>
                <th className="py-3.5 px-6">Bill #</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Total Amount</th>
                <th className="py-3.5 px-6 text-center">Confidence</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {inv.supplier?.name || 'Unassigned Supplier'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {inv.invoiceNumber || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {inv.invoiceDate ? format(new Date(inv.invoiceDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      {inv.currency} {Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {Math.round(inv.aiExtractionConfidence)}% AI
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge
                        variant={
                          inv.status === 'APPROVED'
                            ? 'paid'
                            : inv.status === 'REJECTED'
                            ? 'cancelled'
                            : 'partial'
                        }
                      >
                        {inv.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReviewModal(inv)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No supplier invoices uploaded yet. Drop a PDF or bill photo above to extract.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approve Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Supplier Bill"
        subtitle="Verify extracted data before approving for company expense accounting."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {duplicateWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: A bill with this invoice number already exists for this supplier!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                value={reviewSupplierName}
                onChange={(e) => setReviewSupplierName(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bill / Invoice Number
              </label>
              <input
                type="text"
                value={reviewInvoiceNumber}
                onChange={(e) => setReviewInvoiceNumber(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bill Date
              </label>
              <input
                type="date"
                value={reviewInvoiceDate}
                onChange={(e) => setReviewInvoiceDate(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Total Amount ({currentReviewItem?.currency || 'USD'}) *
              </label>
              <input
                type="number"
                step="any"
                value={reviewTotalAmount}
                onChange={(e) => setReviewTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl font-bold text-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl font-sans"
            />
          </div>

          {currentReviewItem?.filePath && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Uploaded Document File</span>
              <a
                href={`http://localhost:4000${currentReviewItem.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                View Document
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSavingReview}
              onClick={() => handleSaveReview('REJECTED')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
            >
              Reject Bill
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={isSavingReview}
                onClick={() => handleSaveReview('PENDING_REVIEW')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Save as Pending
              </button>
              <button
                type="button"
                disabled={isSavingReview}
                onClick={() => handleSaveReview('APPROVED')}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Record Expense</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

