import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  Receipt,
  Download,
  Building,
  Users,
  CreditCard,
  ChevronRight,
  Star,
  Play,
  BarChart3,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Interactive Hero AI Simulation State
  const samplePrompts = [
    {
      text: 'Create an invoice for ABC Technologies. Website development project cost is LKR 85,000. Add 10% discount and set payment due date to 14 days.',
      customer: 'ABC Technologies (Pvt) Ltd',
      item: 'Website Development & Deployment',
      qty: 1,
      price: 85000,
      discount: 8500,
      currency: 'LKR',
      total: 76500,
    },
    {
      text: 'Bill John Perera for 12 hours of Cloud Architecture Consulting at $150 per hour. Due in 7 days.',
      customer: 'John Perera',
      item: 'Cloud Architecture Consulting',
      qty: 12,
      price: 150,
      discount: 0,
      currency: 'USD',
      total: 1800,
    },
    {
      text: 'Invoice Horizon Media for 3 Brand Identity packages at EUR 800 each with 15% VAT added.',
      customer: 'Horizon Media Group',
      item: 'Brand Identity Design Package',
      qty: 3,
      price: 800,
      discount: 0,
      currency: 'EUR',
      total: 2760,
    },
  ];

  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const currentDemo = samplePrompts[activePromptIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                Invoice<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">
                Autonomous Billing SaaS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3">
                {user?.isSuperAdmin && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all"
                  >
                    Platform Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Autonomous Invoicing & Voice Billing</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Invoicing at the Speed of Thought with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
                Natural AI
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Speak or type what you completed. InvoiceAI instantly extracts client data, calculates taxes and line items, formats pixel-perfect PDFs, and dispatches payment links.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Create Your First Invoice Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                <span>Try Live AI Generator</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Multi-Tenant & Role Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Shared-Hosting & cPanel Ready</span>
              </div>
            </div>
          </div>

          {/* Interactive AI Simulation Widget */}
          <div id="demo" className="mt-16 max-w-4xl mx-auto">
            <div className="p-1 rounded-3xl bg-gradient-to-b from-indigo-500/40 via-slate-800 to-slate-900 shadow-2xl">
              <div className="bg-slate-900 rounded-[22px] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      InvoiceAI Assistant Playground
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Live Engine Preview
                  </span>
                </div>

                {/* Prompt Selector Pills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select a natural-language voice / text prompt:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {samplePrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePromptIndex(idx)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all ${
                          activePromptIndex === idx
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between mb-1">
                          <span>Prompt #{idx + 1}</span>
                          {activePromptIndex === idx && (
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-[11px] text-slate-400">{p.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock Voice & Natural Language Input Area */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1 text-xs text-slate-200 font-mono">
                    "{currentDemo.text}"
                  </div>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
                  >
                    Generate
                  </button>
                </div>

                {/* Simulated Generated Invoice Card */}
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        AI Output • Draft Generated
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Bill To: {currentDemo.customer}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DRAFT (Ready to Issue)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-500 uppercase tracking-wider border-b border-slate-800/60 pb-2">
                        <tr>
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        <tr>
                          <td className="py-2.5 font-medium">{currentDemo.item}</td>
                          <td className="py-2.5 text-right font-mono">{currentDemo.qty}</td>
                          <td className="py-2.5 text-right font-mono">
                            {currentDemo.currency} {currentDemo.price.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right font-bold text-white font-mono">
                            {currentDemo.currency}{' '}
                            {(currentDemo.qty * currentDemo.price).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400">
                      Calculated subtotal, discounts & tax automatically verified.
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Grand Total</span>
                      <span className="text-base font-black text-indigo-400 font-mono">
                        {currentDemo.currency} {currentDemo.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="py-24 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Engineered for Modern Commerce
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything Your Business Needs to Get Paid Faster
            </h2>
            <p className="text-slate-400 text-sm">
              Say goodbye to tedious manual spreadsheets. InvoiceAI pairs advanced LLMs with decimal-safe financial calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Voice & Text Invoicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record your voice on the go or type a single sentence. Our AI transcribes audio and extracts clients, currencies, discounts, and payment terms in milliseconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">4 Vector PDF Templates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose between Modern, Minimal, Corporate, and Creative templates. Built on high-performance PDFKit with guaranteed zero text overlap and cPanel compatibility.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Supplier Bill OCR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Snap a photo or upload incoming supplier invoices (PDF/JPG/PNG). The intelligent OCR extracts line items and dates for instant approval and expense tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operate multiple brands or companies under one login. Strict database guards ensure customer files and financials never leak across tenant boundaries.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Role-Based Access & Admin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assign granular roles: Owner, Admin, Accountant, and Staff. Dedicated Platform Super Admin console to oversee global health and suspend bad actors.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Financial Copilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chat with your embedded business assistant. Query unpaid receivables, overdue aging balances, top paying clients, and next month cashflow forecasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Streamlined Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            From Natural Thought to Issued Invoice in 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
            <span className="text-5xl font-black text-indigo-500/20">01</span>
            <h3 className="text-lg font-bold text-white">Record or Instruct</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tap the microphone or type what work was finished. Mention discounts, customer names, or specific tax percentages.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
            <span className="text-5xl font-black text-indigo-500/20">02</span>
            <h3 className="text-lg font-bold text-white">Review & Fine-Tune</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI populates an editable form. You can adjust line items, swap templates, or preview the vector PDF in real-time.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
            <span className="text-5xl font-black text-indigo-500/20">03</span>
            <h3 className="text-lg font-bold text-white">Dispatch & Collect</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Issue the invoice, send an automated email with PDF attachment, or share a secure client web link to accept payments.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Start Free. Scale as Your Revenue Grows.
            </h2>
            <p className="text-slate-400 text-sm">
              No hidden fees. Every plan includes AI invoice creation and multi-currency billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Starter Freelance
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400">/ forever free</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ideal for solo contractors and creators testing out automated billing.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 20 invoices per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>AI natural language invoicing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Modern PDF export & sharing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1 Business Profile</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold text-center transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-600/20 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Growth Business
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$19</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  For growing agencies, digital consultancies, and small businesses.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-200 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited invoices & receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Voice speech-to-text recording</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All 4 designer PDF templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>AI Supplier Bill OCR & scan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct email invoice dispatch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 5 Business Profiles</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Upgrade to Growth
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Enterprise Agency
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  Custom workflows, unlimited team members, and full accounting compliance.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Everything in Growth Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited team seats & RBAC roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited multi-tenant companies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated cron overdue chasing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated SLA & custom branding</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold text-center transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-white">
              Can I host InvoiceAI on standard cPanel or shared hosting?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Yes! InvoiceAI was purposefully architected for free-first development and cPanel deployment. It relies on standard Node.js/NestJS, MySQL/MariaDB, and lightweight PDFKit rendering without requiring bulky Docker, Redis, or headless Chrome/Puppeteer workers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-white">
              How does the Voice and AI Invoicing work?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              You can click the microphone to speak naturally in your browser (or type plain English sentences). The backend AI model understands your instructions, matches existing customers, computes taxes and discounts, and drafts an invoice. Crucially, it always generates an editable draft first so you have total control before issuing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-white">
              How is tenant data separated between different companies?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Every invoice, customer, payment, and supplier record is strictly locked to its parent company ID. Backend guards enforce tenant boundaries on every single API request, guaranteeing zero unauthorized data access between businesses.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-white">
              What role does the Super Admin have?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Platform Super Admins have a dedicated console to oversee platform-wide health, view total volume, manage tenant companies, toggle active status, review audit logs, and administer global security.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 border-t border-indigo-500/20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Wrestling with Invoices. Let AI Do the Heavy Lifting.
          </h2>
          <p className="text-sm text-indigo-200 max-w-xl mx-auto">
            Join forward-thinking businesses already generating invoices in seconds with InvoiceAI.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold bg-white text-indigo-950 hover:bg-slate-100 shadow-2xl transition-all hover:scale-105"
            >
              <span>Get Started Now — It's Free</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              AI
            </div>
            <span className="font-bold text-slate-300">InvoiceAI SaaS Platform</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">
              Create Account
            </Link>
            <a href="#features" className="hover:text-slate-300 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-300 transition-colors">
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

