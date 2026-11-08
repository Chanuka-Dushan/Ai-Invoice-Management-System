import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  Plus,
  Trash2,
  Eye,
  Save,
  Send,
  Building,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Loader2,
  FileCheck,
  Layout,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Customer, Product, TemplateLayout } from '../../types';
import { VoiceRecorderModal } from '../../components/voice/VoiceRecorderModal';
import { InvoicePreview } from '../../components/templates/InvoicePreview';
import { Modal } from '../../components/ui/Modal';
import { format, addDays } from 'date-fns';

interface LineItemForm {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  lineTotal: number;
}

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCompany } = useAuth();

  // Mode switcher: 'ai' or 'manual'
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>(
    searchParams.get('mode') === 'ai' ? 'ai' : 'manual',
  );

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiAssumptions, setAiAssumptions] = useState<string[]>([]);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Customers & Products lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState<string>(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [currency, setCurrency] = useState<string>(activeCompany?.defaultCurrency || 'USD');
  const [templateName, setTemplateName] = useState<TemplateLayout>('MODERN');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [shippingAmount, setShippingAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');

  const [items, setItems] = useState<LineItemForm[]>([
    {
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      taxRate: 0,
      lineTotal: 0,
    },
  ]);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize defaults from company profile & next invoice number
  useEffect(() => {
    if (activeCompany) {
      setCurrency(activeCompany.defaultCurrency || 'USD');
      setPaymentInstructions(activeCompany.bankDetails || '');
      setTermsAndConditions(activeCompany.defaultPaymentTerms || '');
      setNotes(activeCompany.defaultInvoiceFooter || '');

      // Fetch next number
      apiClient.get('/invoices/next-number').then((res) => {
        setInvoiceNumber(res.data.nextInvoiceNumber);
      }).catch(console.error);

      // Fetch customers & products
      apiClient.get('/customers').then((res) => setCustomers(res.data)).catch(console.error);
      apiClient.get('/products').then((res) => setProducts(res.data)).catch(console.error);
    }
  }, [activeCompany]);

  // Recalculate line total for an item
  const updateItem = (index: number, field: keyof LineItemForm, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };

    const qty = Number(current.quantity) || 0;
    const price = Number(current.unitPrice) || 0;
    const disc = Math.min(100, Math.max(0, Number(current.discountRate) || 0));
    const tax = Math.max(0, Number(current.taxRate) || 0);

    const base = qty * price;
    const afterDisc = base - base * (disc / 100);
    const lineTotal = afterDisc + afterDisc * (tax / 100);

    current.lineTotal = Math.round((lineTotal + Number.EPSILON) * 100) / 100;
    updated[index] = current;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        taxRate: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Live Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const itemDiscounts = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * (item.discountRate / 100)),
    0,
  );
  const totalItemTax = items.reduce((sum, item) => {
    const afterDisc = (item.quantity * item.unitPrice) * (1 - item.discountRate / 100);
    return sum + afterDisc * (item.taxRate / 100);
  }, 0);

  const invoiceDiscount =
    discountType === 'FIXED' ? discountValue : subtotal * (discountValue / 100);
  const totalAmount = Math.max(0, subtotal - itemDiscounts - invoiceDiscount) + totalItemTax + shippingAmount;

  // Handle AI invoice generation
  const handleGenerateWithAi = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsAiGenerating(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post('/ai/generate-invoice', { prompt: promptText });
      const draft = res.data;

      // Populate form fields from AI structured JSON
      if (draft.customer?.id) {
        setSelectedCustomerId(draft.customer.id);
      } else if (draft.customer?.name) {
        // Auto-create customer if missing
        try {
          const newCust = await apiClient.post('/customers', {
            name: draft.customer.name,
            companyName: draft.customer.companyName,
            email: draft.customer.email,
            phone: draft.customer.phone,
          });
          setCustomers((prev) => [...prev, newCust.data]);
          setSelectedCustomerId(newCust.data.id);
        } catch {
          // If customer creation fails, continue
        }
      }

      if (draft.issueDate) setIssueDate(draft.issueDate);
      if (draft.dueDate) setDueDate(draft.dueDate);
      if (draft.currency) setCurrency(draft.currency);
      if (draft.discountType) setDiscountType(draft.discountType);
      if (draft.discountValue !== undefined) setDiscountValue(draft.discountValue);
      if (draft.shippingAmount !== undefined) setShippingAmount(draft.shippingAmount);
      if (draft.paymentInstructions) setPaymentInstructions(draft.paymentInstructions);
      if (draft.termsAndConditions) setTermsAndConditions(draft.termsAndConditions);
      if (draft.notes) setNotes(draft.notes);

      if (draft.items && draft.items.length > 0) {
        setItems(
          draft.items.map((i: any) => ({
            name: i.name || 'Services',
            description: i.description || '',
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            discountRate: i.discountRate || 0,
            taxRate: i.taxRate || 0,
            lineTotal: i.lineTotal || 0,
          })),
        );
      }

      setAiAssumptions(draft.assumptions || []);
      setAiQuestions(draft.followUpQuestions || []);
      // Switch view to the editable form to review
      setActiveMode('manual');
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to generate invoice with AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateCustomerInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await apiClient.post('/customers', {
        name: newCustName.trim(),
        email: newCustEmail.trim() || undefined,
        phone: newCustPhone.trim() || undefined,
      });
      setCustomers((prev) => [...prev, res.data]);
      setSelectedCustomerId(res.data.id);
      setIsNewCustomerModalOpen(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleSaveInvoice = async (status: 'DRAFT' | 'ISSUED') => {
    if (!selectedCustomerId) {
      setErrorMessage('Please select or create a customer.');
      return;
    }
    if (items.some((i) => !i.name.trim() || i.unitPrice <= 0)) {
      setErrorMessage('Each line item must have a valid title and unit price greater than 0.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        customerId: selectedCustomerId,
        invoiceNumber,
        referenceNumber: referenceNumber || undefined,
        issueDate,
        dueDate,
        currency,
        status,
        discountType,
        discountValue,
        shippingAmount,
        notes,
        termsAndConditions,
        paymentInstructions,
        templateName,
        items: items.map((i) => ({
          name: i.name,
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountRate: Number(i.discountRate || 0),
          taxRate: Number(i.taxRate || 0),
        })),
      };

      const res = await apiClient.post('/invoices', payload);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: any) {
      console.error('Save invoice error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview data construct
  const previewInvoiceData = {
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    status: 'DRAFT' as any,
    subtotal,
    discountAmount: itemDiscounts + invoiceDiscount,
    taxAmount: totalItemTax,
    shippingAmount,
    totalAmount,
    paidAmount: 0,
    outstandingBalance: totalAmount,
    notes,
    paymentInstructions,
    templateName,
    company: activeCompany || undefined,
    customer: customers.find((c) => c.id === selectedCustomerId) || ({ name: 'Select Customer' } as any),
    items,
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Invoice</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose between standard manual form creation or rapid AI generation from natural language instructions.
          </p>
        </div>

        {/* Two Creation Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Create Manually</span>
          </button>
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeMode === 'ai'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* AI ASSISTANT GENERATION CARD */}
      {activeMode === 'ai' && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Built-in AI Invoice Assistant
              </span>
              <h2 className="text-xl font-bold mt-2">What would you like to invoice?</h2>
              <p className="text-xs text-indigo-200 max-w-xl">
                Type in natural language or tap the microphone to speak. The AI extracts customer info, items, rates, discounts, and payment terms into an editable draft.
              </p>
            </div>
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create an invoice for ABC Technologies. I completed a website development project for them. The project cost is LKR 85,000. Add a 10% discount and set the payment due date to 14 days from today."
              className="w-full bg-slate-900/80 border border-indigo-700/60 rounded-2xl p-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
            />
          </div>

          {/* Prompt Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-indigo-300 font-semibold">Try examples:</span>
            {[
              'Invoice John Perera for 5 hours of software development at LKR 4,000 per hour due in 7 days.',
              'Create invoice for Nexora Media: 1 Brand Design Package at $1,200 and SEO Setup for $450 with 5% tax.',
            ].map((eg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAiPrompt(eg)}
                className="text-[11px] bg-indigo-800/40 hover:bg-indigo-700/60 text-indigo-200 border border-indigo-600/40 px-2.5 py-1 rounded-lg transition-colors text-left"
              >
                "{eg.slice(0, 48)}..."
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isAiGenerating || !aiPrompt.trim()}
              onClick={() => handleGenerateWithAi(aiPrompt)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Invoice Draft
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Assumptions & Follow-up Questions Banner */}
      {(aiAssumptions.length > 0 || aiQuestions.length > 0) && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
          {aiAssumptions.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Assumptions Made
              </span>
              <ul className="text-xs text-indigo-800 list-disc pl-5 space-y-0.5">
                {aiAssumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {aiQuestions.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-indigo-100">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Follow-up Information Needed
              </span>
              <ul className="text-xs text-amber-800 list-disc pl-5 space-y-0.5">
                {aiQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* INVOICE EDITABLE FORM */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Top Header Information: Customer, Dates, Currency, Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Customer Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer *
              </label>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                + New Customer
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>

          {/* Issue Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Currency & Template Chooser */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="USD">USD ($)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AUD">AUD ($)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reference / PO #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. PO-89234"
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              PDF Template Layout
            </label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value as TemplateLayout)}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="MODERN">Modern (Standard)</option>
              <option value="MINIMAL">Minimalist</option>
              <option value="CORPORATE">Corporate & Official</option>
              <option value="CREATIVE">Creative (Vibrant)</option>
            </select>
          </div>
        </div>

        {/* INVOICE LINE ITEMS */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Line Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl items-start"
              >
                {/* Title & Description */}
                <div className="col-span-12 sm:col-span-5 space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Product or service name *"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="w-full p-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Optional description / details..."
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-600"
                  />
                </div>

                {/* Qty */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white text-right"
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white text-right font-medium"
                  />
                </div>

                {/* Discount % */}
                <div className="col-span-4 sm:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Disc %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountRate}
                    onChange={(e) => updateItem(idx, 'discountRate', e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white text-right text-xs"
                  />
                </div>

                {/* Line Total & Remove */}
                <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-6">
                  <span className="font-bold text-sm text-slate-900">
                    {currency} {item.lineTotal.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION: NOTES & FINANCIAL SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          {/* Notes & Bank Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Instructions & Bank Account
              </label>
              <textarea
                rows={3}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Bank name, account number, branch, SWIFT..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Invoice Footer / Client Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business!"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-3.5 h-fit">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{currency} {subtotal.toFixed(2)}</span>
            </div>

            {/* Invoice-level Discount */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Discount:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="text-xs p-1 border border-slate-200 rounded bg-white"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">{currency}</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-16 p-1 text-xs border border-slate-200 rounded text-right bg-white"
                />
              </div>
              <span className="font-semibold text-emerald-600">
                -{currency} {(itemDiscounts + invoiceDiscount).toFixed(2)}
              </span>
            </div>

            {/* Tax */}
            {totalItemTax > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax:</span>
                <span className="font-semibold text-slate-900">{currency} {totalItemTax.toFixed(2)}</span>
              </div>
            )}

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Shipping / Additional:</span>
              <input
                type="number"
                min="0"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(Number(e.target.value))}
                className="w-24 p-1 text-xs border border-slate-200 rounded text-right bg-white font-semibold"
              />
            </div>

            {/* Grand Total */}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-lg font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-indigo-600">{currency} {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Invoice</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveInvoice('DRAFT')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveInvoice('ISSUED')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Issue Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptionSuccess={(text) => {
          setAiPrompt(text);
          handleGenerateWithAi(text);
        }}
      />

      {/* Live Invoice Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Live Invoice Preview"
        subtitle={`Template: ${templateName}`}
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto p-2">
          <InvoicePreview invoice={previewInvoiceData} template={templateName} />
        </div>
      </Modal>

      {/* Inline Create Customer Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Add New Customer"
        subtitle="Quickly add a client directly to this invoice."
      >
        <form onSubmit={handleCreateCustomerInline} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Customer / Contact Name *
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. John Perera or ABC Corp"
              className="w-full p-3 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              placeholder="billing@customer.com"
              className="w-full p-3 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+1 555 1234"
              className="w-full p-3 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              Add Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

