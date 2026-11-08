import React from 'react';
import { Invoice, TemplateLayout } from '../../types';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
  template?: TemplateLayout;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  template = invoice.templateName || 'MODERN',
}) => {
  const company = invoice.company;
  const customer = invoice.customer;
  const brandColor = company?.brandColor || '#1e3a8a';

  const formatCurrency = (amount: number | string | undefined) => {
    const val = Number(amount || 0);
    return `${invoice.currency || 'USD'} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="paid">PAID</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="partial">PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="overdue">OVERDUE</Badge>;
      case 'ISSUED':
        return <Badge variant="issued">ISSUED</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">CANCELLED</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="draft">DRAFT</Badge>;
    }
  };

  // 1. MODERN TEMPLATE
  if (template === 'MODERN') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-slate-800 font-sans max-w-4xl mx-auto">
        <div style={{ backgroundColor: brandColor }} className="h-3 w-full" />
        <div className="p-8 sm:p-12 space-y-8">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-3">
              {company?.logoUrl ? (
                <img
                  src={`http://localhost:4000${company.logoUrl}`}
                  alt={company.name}
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <h1 style={{ color: brandColor }} className="text-2xl font-black tracking-tight">
                  {company?.name || 'Your Company Name'}
                </h1>
              )}
              <div className="text-xs text-slate-500 space-y-0.5 leading-relaxed">
                {company?.address1 && <p>{company.address1}</p>}
                {(company?.city || company?.country) && (
                  <p>{[company.city, company.state, company.postalCode, company.country].filter(Boolean).join(', ')}</p>
                )}
                {company?.email && <p>Email: {company.email}</p>}
                {company?.taxNumber && <p>Tax ID: {company.taxNumber}</p>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-2">
              <div className="flex items-center sm:justify-end gap-3">
                <span className="text-3xl font-black tracking-tight text-slate-900">INVOICE</span>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-sm font-bold text-slate-700">{invoice.invoiceNumber || 'INV-DRAFT'}</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  <span className="font-medium text-slate-700">Issue Date:</span>{' '}
                  {invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM dd, yyyy') : '-'}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Due Date:</span>{' '}
                  {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                </p>
                {invoice.referenceNumber && (
                  <p>
                    <span className="font-medium text-slate-700">Ref:</span> {invoice.referenceNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100">
            <div>
              <p style={{ color: brandColor }} className="text-xs font-bold uppercase tracking-wider mb-2">
                Billed To
              </p>
              <h3 className="font-bold text-slate-900 text-base">{customer?.name || 'Customer Name'}</h3>
              {customer?.companyName && <p className="text-xs font-medium text-slate-600">{customer.companyName}</p>}
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                {customer?.email && <p>{customer.email}</p>}
                {customer?.phone && <p>{customer.phone}</p>}
                {customer?.address1 && <p>{customer.address1}</p>}
                {(customer?.city || customer?.country) && (
                  <p>{[customer.city, customer.country].filter(Boolean).join(', ')}</p>
                )}
                {customer?.taxId && <p>Tax ID: {customer.taxId}</p>}
              </div>
            </div>
            {company?.defaultPaymentTerms && (
              <div>
                <p style={{ color: brandColor }} className="text-xs font-bold uppercase tracking-wider mb-2">
                  Payment Terms
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{company.defaultPaymentTerms}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-500 text-xs">
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Section: Notes & Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4">
            <div className="w-full sm:w-1/2 space-y-4">
              {invoice.paymentInstructions && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank & Payment Instructions
                  </p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
                    {invoice.paymentInstructions}
                  </pre>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-slate-500">{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-80 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tax / VAT:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {Number(invoice.shippingAmount) > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Shipping:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.shippingAmount)}</span>
                </div>
              )}
              <div
                style={{ backgroundColor: brandColor }}
                className="flex justify-between items-center p-3 rounded-xl text-white font-bold text-sm shadow-sm"
              >
                <span>Grand Total:</span>
                <span className="text-base">{formatCurrency(invoice.totalAmount)}</span>
              </div>

              {Number(invoice.paidAmount) > 0 && (
                <>
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-600 font-bold border-t border-slate-100 pt-1">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice.outstandingBalance)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MINIMAL TEMPLATE
  if (template === 'MINIMAL') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-slate-900 font-sans max-w-4xl mx-auto shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-slate-900 uppercase">
              {company?.name || 'Company Name'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{company?.email}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Invoice</span>
            <p className="text-xl font-mono font-bold text-slate-900">{invoice.invoiceNumber || 'INV-0001'}</p>
            <p className="text-xs text-slate-500 mt-1">
              Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : '-'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">To</p>
          <p className="font-medium text-slate-900">{customer?.name}</p>
          <p className="text-xs text-slate-500">{customer?.email}</p>
        </div>

        <table className="w-full text-left text-sm mb-8">
          <thead>
            <tr className="border-b border-slate-900 text-xs uppercase text-slate-500 pb-2">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium text-slate-800">{item.name}</td>
                <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-slate-900 pt-4">
          <div className="w-64 space-y-2 text-right">
            <p className="text-xs text-slate-500">Subtotal: {formatCurrency(invoice.subtotal)}</p>
            <p className="text-lg font-bold font-mono text-slate-900">Total: {formatCurrency(invoice.totalAmount)}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. CORPORATE TEMPLATE
  if (template === 'CORPORATE') {
    return (
      <div className="bg-white rounded-none border-2 border-slate-800 p-8 sm:p-12 text-slate-900 font-serif max-w-4xl mx-auto shadow-md">
        <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">{company?.name}</h1>
            <p className="text-xs text-slate-600 mt-1 italic font-sans">{company?.address1}</p>
            <p className="text-xs text-slate-600 font-sans">Business Reg: {company?.businessRegNumber || 'N/A'}</p>
          </div>
          <div className="text-right border-l-2 border-slate-800 pl-6 font-sans">
            <h2 className="text-2xl font-black text-slate-900">TAX INVOICE</h2>
            <p className="text-xs font-mono font-bold mt-1">NO: {invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-600">DATE: {invoice.issueDate ? format(new Date(invoice.issueDate), 'dd/MM/yyyy') : '-'}</p>
          </div>
        </div>

        <div className="border border-slate-800 p-4 mb-6 font-sans text-xs grid grid-cols-2">
          <div>
            <p className="font-bold uppercase text-slate-800">CLIENT DETAILS:</p>
            <p className="font-bold text-sm text-slate-900 mt-1">{customer?.name}</p>
            <p className="text-slate-600">{customer?.address1}</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase text-slate-800">PAYMENT DUE:</p>
            <p className="font-bold text-sm text-slate-900 mt-1">
              {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : '-'}
            </p>
          </div>
        </div>

        <table className="w-full text-left font-sans text-xs border border-slate-800 mb-6">
          <thead className="bg-slate-100 border-b border-slate-800 font-bold uppercase">
            <tr>
              <th className="p-2 border-r border-slate-800">Item</th>
              <th className="p-2 border-r border-slate-800 text-right">Qty</th>
              <th className="p-2 border-r border-slate-800 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-200 font-medium">{item.name}</td>
                <td className="p-2 border-r border-slate-200 text-right">{item.quantity}</td>
                <td className="p-2 border-r border-slate-200 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-2 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start font-sans text-xs">
          <div className="border border-slate-800 p-3 w-1/2">
            <p className="font-bold uppercase mb-1">Bank Information:</p>
            <p className="whitespace-pre-line text-slate-600">{invoice.paymentInstructions}</p>
          </div>
          <div className="w-64 space-y-1 text-right">
            <p className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Amount:</span>
              <span className="font-black text-sm">{formatCurrency(invoice.totalAmount)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. CREATIVE TEMPLATE
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-xl max-w-4xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 sm:p-12 text-white flex justify-between items-center">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider">
            Creative Invoice
          </span>
          <h1 className="text-3xl font-black mt-3">{company?.name || 'Your Brand'}</h1>
          <p className="text-xs text-purple-200 mt-1">{company?.email}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">{invoice.invoiceNumber}</p>
          <p className="text-xs text-purple-200 mt-1">Due {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}</p>
        </div>
      </div>

      <div className="p-8 sm:p-12 space-y-8">
        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 flex justify-between">
          <div>
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-1">Prepared For</p>
            <h3 className="text-lg font-bold text-slate-900">{customer?.name}</h3>
            <p className="text-xs text-slate-500">{customer?.email}</p>
          </div>
          <div className="text-right">
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        <div className="space-y-3">
          {(invoice.items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-purple-50/40 transition-colors">
              <div>
                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900 text-sm">{formatCurrency(item.lineTotal)}</p>
                <p className="text-xs text-slate-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <div className="w-72 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl space-y-2 shadow-lg">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-black border-t border-slate-700 pt-2">
              <span>Total Due</span>
              <span className="text-violet-400">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

