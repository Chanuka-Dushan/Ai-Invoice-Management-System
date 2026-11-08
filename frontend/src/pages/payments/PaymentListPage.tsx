import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Payment } from '../../types';
import { format } from 'date-fns';

export const PaymentListPage: React.FC = () => {
  const { activeCompany } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) fetchPayments();
  }, [activeCompany]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete payment record? The invoice outstanding balance will be recalculated.')) return;
    try {
      await apiClient.delete(`/payments/${id}`);
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  const currency = activeCompany?.defaultCurrency || 'USD';
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments Collected</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of received customer payments and transaction settlements.
          </p>
        </div>

        {/* Total Collected Highlight */}
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Collected</p>
            <p className="text-base font-black text-emerald-900">{currency} {totalCollected.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Method</th>
                <th className="py-3.5 px-6">Reference</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {format(new Date(p.paymentDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {p.invoice?.invoiceNumber || 'Direct Payment'}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {p.invoice?.customer?.name || 'Customer'}
                    </td>
                    <td className="py-4 px-6 uppercase text-xs text-slate-500">
                      {p.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {p.transactionReference || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600">
                      +{p.currency} {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No payment records found. Payments can be recorded against issued invoices.
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

