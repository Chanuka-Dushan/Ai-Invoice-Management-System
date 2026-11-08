import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  CheckCircle2,
  Send,
  CreditCard,
  Ban,
  Trash2,
  ArrowLeft,
  Check,
  Building,
  Calendar,
  AlertCircle,
  Copy,
  Mail,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Invoice, PaymentMethod } from '../../types';
import { InvoicePreview } from '../../components/templates/InvoicePreview';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { downloadInvoicePdf } from '../../api/pdf';
import { format } from 'date-fns';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Email Invoice Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailCustomNote, setEmailCustomNote] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/invoices/${id}`);
      setInvoice(res.data);
      setPaymentAmount(Number(res.data.outstandingBalance));
      if (res.data.customer?.email) {
        setRecipientEmail(res.data.customer.email);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleIssueInvoice = async () => {
    if (!id) return;
    try {
      await apiClient.post(`/invoices/${id}/issue`);
      fetchInvoice();
    } catch (err) {
      console.error('Failed to issue invoice:', err);
    }
  };

  const handleCancelInvoice = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await apiClient.post(`/invoices/${id}/cancel`);
      fetchInvoice();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel invoice');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this draft invoice?')) return;
    try {
      await apiClient.delete(`/invoices/${id}`);
      navigate('/invoices');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleCopyLink = () => {
    if (!invoice?.publicToken) return;
    const url = `${window.location.origin}/view-invoice/${invoice.publicToken}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    if (!invoice?.id) return;
    downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      await apiClient.post('/payments', {
        invoiceId: id,
        amount: paymentAmount,
        currency: invoice?.currency,
        paymentDate,
        paymentMethod,
        transactionReference: transactionReference || undefined,
        notes: paymentNotes || undefined,
      });
      setIsPaymentModalOpen(false);
      fetchInvoice();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !recipientEmail.trim()) return;

    setIsSendingEmail(true);
    try {
      await apiClient.post(`/notifications/send-invoice/${id}`, {
        recipientEmail: recipientEmail.trim(),
        customNote: emailCustomNote.trim() || undefined,
      });
      setEmailSentSuccess(true);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSentSuccess(false);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading || !invoice) {
    return <div className="p-8 text-center text-slate-400">Loading invoice details...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{invoice.invoiceNumber}</h1>
              <Badge variant={invoice.status.toLowerCase() as any}>{invoice.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <span className="font-semibold text-slate-800">{invoice.customer.name}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleIssueInvoice}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue Invoice</span>
            </button>
          )}

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsEmailModalOpen(true);
              setEmailSentSuccess(false);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Email Invoice</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Link Copied!' : 'Public Link'}</span>
          </button>

          {invoice.status === 'DRAFT' ? (
            <button
              onClick={handleDeleteInvoice}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : invoice.status !== 'CANCELLED' && Number(invoice.paidAmount) === 0 ? (
            <button
              onClick={handleCancelInvoice}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Cancel Invoice"
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Invoice Template Render Preview */}
      <div className="bg-slate-100/60 p-4 sm:p-8 rounded-3xl border border-slate-200/60">
        <InvoicePreview invoice={invoice} template={invoice.templateName} />
      </div>

      {/* Payment History Section */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-2">Date</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">Reference</th>
                  <th className="py-2">Notes</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-medium">{format(new Date(p.paymentDate), 'MMM dd, yyyy')}</td>
                    <td className="py-2.5 uppercase text-slate-600">{p.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-2.5 font-mono text-slate-500">{p.transactionReference || 'N/A'}</td>
                    <td className="py-2.5 text-slate-500">{p.notes || '-'}</td>
                    <td className="py-2.5 text-right font-black text-emerald-600">
                      +{invoice.currency} {Number(p.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        subtitle={`Invoice ${invoice.invoiceNumber} • Outstanding: ${invoice.currency} ${Number(invoice.outstandingBalance).toFixed(2)}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Amount ({invoice.currency}) *
            </label>
            <input
              type="number"
              step="any"
              max={Number(invoice.outstandingBalance)}
              min="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full p-3 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="ONLINE_GATEWAY">Online Gateway</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Transaction Reference / Cheque No.
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. TXN-892184 or CHQ-00123"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Received via Commercial Bank"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Email Invoice Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title={`Email Invoice ${invoice.invoiceNumber}`}
        subtitle={`Dispatch an official invoice email with attached vector PDF to ${invoice.customer.name}.`}
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          {emailSentSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Invoice and PDF dispatched successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@company.com"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Custom Message / Note (Optional)
            </label>
            <textarea
              rows={3}
              value={emailCustomNote}
              onChange={(e) => setEmailCustomNote(e.target.value)}
              placeholder="Thank you for your business. Please find attached invoice..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSendingEmail || emailSentSuccess}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending PDF...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invoice Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

