import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, CreditCard, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Invoice } from '../../types';
import { InvoicePreview } from '../../components/templates/InvoicePreview';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const PublicInvoiceViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Online Checkout modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    apiClient
      .get(`/invoices/public/${token}`)
      .then((res) => {
        setInvoice(res.data);
      })
      .catch((err) => {
        console.error('Failed to load public invoice:', err);
        setError('Invoice link has expired or is invalid.');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleDownloadPdf = () => {
    if (!token) return;
    window.open(`http://localhost:4000/pdf/invoices/public/${token}`, '_blank');
  };

  const handleOnlinePaymentSim = async () => {
    setIsProcessingPayment(true);
    try {
      // Connect to online checkout adapter endpoint
      const res = await apiClient.post(`/payments/checkout/public/${token}`, {
        amount: invoice?.outstandingBalance,
      });

      // Simulate instantaneous gateway completion in dev
      setTimeout(() => {
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading secure invoice...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This invoice link could not be found or has been revoked by the issuer.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Invoice {invoice.invoiceNumber}</p>
              <p className="text-[11px] text-slate-500">Secure Client Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {invoice.status !== 'PAID' && (
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Now ({invoice.currency} {Number(invoice.outstandingBalance).toFixed(2)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Invoice Body Template */}
        <div className="shadow-xl rounded-2xl overflow-hidden">
          <InvoicePreview invoice={invoice} template={invoice.templateName} />
        </div>

        {/* Security & Powered by Footer */}
        <div className="text-center text-xs text-slate-400 py-4 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted 256-bit Secure Invoice Portal • Powered by InvoiceAI</span>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setPaymentSuccess(false);
        }}
        title="Secure Online Payment"
        subtitle={`Pay outstanding amount: ${invoice.currency} ${Number(invoice.outstandingBalance).toFixed(2)}`}
      >
        {paymentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Payment Successfully Processed</h3>
            <p className="text-xs text-slate-500">
              Your transaction has been authorized and recorded. A receipt has been issued to your billing email.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Invoice To:</span>
                <span className="font-semibold text-slate-900">{invoice.customer.name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Payment Recipient:</span>
                <span className="font-semibold text-slate-900">{invoice.company?.name}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Amount Due:</span>
                <span className="text-indigo-600">{invoice.currency} {Number(invoice.outstandingBalance).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">Card Details</label>
              <input
                type="text"
                placeholder="4242 •••• •••• 4242"
                className="w-full p-3 text-sm font-mono border border-slate-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="p-3 text-sm font-mono border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="p-3 text-sm font-mono border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleOnlinePaymentSim}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Authorize & Pay {invoice.currency} {Number(invoice.outstandingBalance).toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

