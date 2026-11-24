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
  Code2,
  Terminal,
  BookOpen,
  Copy,
  Check,
  X,
  Puzzle,
  FileCode,
  Layers,
  Plug,
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

  // Developer Section & Documentation Modal State
  const [selectedCodeLang, setSelectedCodeLang] = useState<'curl' | 'javascript' | 'php' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [docsModalTab, setDocsModalTab] = useState<'api' | 'wordpress'>('api');

  const codeSnippets = {
    curl: `curl -X POST "https://your-domain.com/api/v1/invoices" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: inv_live_YOUR_API_KEY" \\
  -d '{
    "customer": {
      "name": "Acme Global Corp",
      "email": "billing@acme.com"
    },
    "currency": "USD",
    "items": [
      {
        "name": "Cloud Hosting & Dedicated Server (Annual)",
        "quantity": 1,
        "unitPrice": 1200.00,
        "taxRate": 10
      }
    ],
    "autoIssue": true,
    "sendEmail": true
  }'`,

    javascript: `// Node.js or Browser Fetch
const createInvoice = async () => {
  const res = await fetch("https://your-domain.com/api/v1/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": "inv_live_YOUR_API_KEY"
    },
    body: JSON.stringify({
      customer: {
        name: "Acme Global Corp",
        email: "billing@acme.com"
      },
      currency: "USD",
      items: [
        {
          name: "Website Redesign & SEO Package",
          quantity: 1,
          unitPrice: 2500.00
        }
      ],
      autoIssue: true
    })
  });

  const { invoice } = await res.json();
  console.log("Invoice Created:", invoice.invoiceNumber);
  console.log("PDF Link:", invoice.pdfDownloadUrl);
};`,

    php: `<?php
// WordPress / PHP Integration
$apiKey = 'inv_live_YOUR_API_KEY';
$apiUrl = 'https://your-domain.com/api/v1/invoices';

$payload = [
    'customer' => [
        'name'  => 'Acme Global Corp',
        'email' => 'billing@acme.com'
    ],
    'currency' => 'USD',
    'items' => [
        [
            'name'      => 'Custom E-Commerce Theme',
            'quantity'  => 1,
            'unitPrice' => 850.00
        ]
    ],
    'autoIssue' => true
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-KEY: ' . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);
?>`,

    python: `import requests

API_KEY = "inv_live_YOUR_API_KEY"
API_URL = "https://your-domain.com/api/v1/invoices"

headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY
}

payload = {
    "customer": {
        "name": "Acme Global Corp",
        "email": "billing@acme.com"
    },
    "currency": "USD",
    "items": [
        {
            "name": "Machine Learning API Access",
            "quantity": 10,
            "unitPrice": 50.00
        }
    ],
    "autoIssue": True
}

res = requests.post(API_URL, json=payload, headers=headers)
print(res.json()["invoice"]["invoiceNumber"])`,
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openDocs = (tab: 'api' | 'wordpress') => {
    setDocsModalTab(tab);
    setDocsModalOpen(true);
  };

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
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
            <a
              href="#developers"
              className="hover:text-white transition-colors flex items-center gap-1.5 text-indigo-400 font-bold"
            >
              <Code2 className="w-4 h-4" />
              <span>Developers</span>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Autonomous Invoicing & Billing</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Create, Track & Settle Invoices using{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Natural Voice & AI
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              No manual data entry. Speak or type instructions in plain English, and InvoiceAI auto-extracts line items,
              matches existing customers, calculates taxes, and generates PDF invoices ready to dispatch.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Try Free Today — No CC Required</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-indigo-400" />
                <span>See Live Demo</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Multi-Tenant Organization Isolation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>High-Precision Decimal Accounting</span>
              </div>
              <div className="flex items-center gap-1.5">
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    Generate
                  </button>
                </div>

                {/* Real-time Parsed Result Card */}
                <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 uppercase font-bold tracking-wider">
                      AI Generated Output Preview
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Calculated with 100% Precision
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Customer</span>
                      <span className="font-bold text-white">{currentDemo.customer}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Item Description</span>
                      <span className="font-bold text-white">{currentDemo.item}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Quantity & Rate</span>
                      <span className="font-bold text-white">
                        {currentDemo.qty} × {currentDemo.currency} {currentDemo.price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Calculated Total</span>
                      <span className="font-bold text-indigo-400 text-sm">
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
              Built for Modern Businesses
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything You Need to Streamline Your Cash Flow
            </h2>
            <p className="text-slate-400 text-sm">
              From natural voice invoice synthesis to multi-tenant isolation and automated payment chasing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Voice & Natural Language AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click to talk or type quick messages. Our backend AI extracts customers, items, unit prices, discounts, and payment terms into structured JSON.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant Company Profiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operate multiple businesses under one account. Store logos, tax numbers, bank accounts, and custom footers that automatically brand each invoice.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Incoming Supplier OCR Bills</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Snap photos or upload vendor PDFs. AI extracts supplier names, line items, and payment due dates into your expenses tracker effortlessly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">4 Certified PDF Templates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose between Modern, Classic, Minimal, and Bold layouts. Generated via pure PDFKit with no Puppeteer or Chrome server overhead.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Payments & Partial Balances</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log manual payments or accept card checkouts online. Automatically marks invoices as Paid, Partially Paid, or Overdue with strict audit logs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Plug className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">REST API & WordPress Plugin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect external websites, custom web apps, or WooCommerce stores with our scoped API keys. Auto-sync orders into certified tax invoices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Simple 3-Step Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            From Conversation to Paid Invoice
          </h2>
          <p className="text-slate-400 text-sm">
            Say goodbye to clunky spreadsheet tables and multi-step manual forms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
            <span className="text-5xl font-black text-indigo-500/20">01</span>
            <h3 className="text-lg font-bold text-white">Speak or Type</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dictate your invoice in natural language or type plain instructions. AI resolves customer names, unit prices, and quantities.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
            <span className="text-5xl font-black text-indigo-500/20">02</span>
            <h3 className="text-lg font-bold text-white">Review & Brand</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review calculated subtotal, discounts, and taxes with exact decimal arithmetic. Select your preferred template design.
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

      {/* 5. NEW: Developer Platform, REST API & WordPress Integration Section */}
      <section id="developers" className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>DEVELOPER PLATFORM & E-COMMERCE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Integrate Invoicing Anywhere
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Connect external websites, custom web apps, and WooCommerce stores directly to your InvoiceAI billing
              organization. Generate certified invoices programmatically or automatically upon checkout.
            </p>
          </div>

          {/* Dual Cards Grid: WordPress Plugin & REST API */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: WordPress & WooCommerce Plugin */}
            <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-900/40 rounded-3xl border border-indigo-500/30 p-8 sm:p-10 flex flex-col justify-between space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                    Official WordPress Plugin
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
                    WooCommerce Verified
                  </span>
                  <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Plug className="w-6 h-6 text-indigo-400" />
                    <span>InvoiceAI Sync for WooCommerce</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Automate your entire online store billing. When customers purchase on WooCommerce, this plugin
                    automatically creates matching tax invoices, syncs customer records, and provides instant PDF download
                    receipts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Instant order-to-invoice sync on checkout</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Customer & tax mapping automatically</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>PDF download button on Order Receipt & Email</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>WooCommerce Order Metabox & 1-click re-sync</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-indigo-500/20 relative z-10">
                <a
                  href="/downloads/invoiceai-sync.zip"
                  download="invoiceai-sync.zip"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Plugin (ZIP)</span>
                </a>
                <button
                  onClick={() => openDocs('wordpress')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>WooCommerce Guide</span>
                </button>
              </div>
            </div>

            {/* Card 2: REST API Platform */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-10 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                      REST API v1
                    </span>
                    <span className="text-xs text-slate-400">JSON & PDF Streams</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(codeSnippets[selectedCodeLang])}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Snippet Box with Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['curl', 'javascript', 'php', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedCodeLang(lang)}
                        className={`flex-1 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                          selectedCodeLang === lang
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : lang.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-52 leading-relaxed">
                    <pre>{codeSnippets[selectedCodeLang]}</pre>
                  </div>
                </div>

                {/* Quick Endpoint Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Endpoints:</span>
                  <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">
                    POST /api/v1/invoices
                  </code>
                  <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 border border-slate-800">
                    GET /api/v1/invoices/:id/pdf
                  </code>
                  <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">
                    POST /api/v1/invoices/:id/payments
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => openDocs('api')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read API Documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
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
              No hidden fees. Every plan includes AI invoice creation, API access, and multi-currency billing.
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
                  For thriving agencies, e-commerce stores, and high-volume billers.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited AI invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full REST API & WordPress Plugin</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 5 Business Profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>OCR Incoming Supplier Processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom brand colors & logos</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Enterprise
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  Custom billing rules, dedicated SLA, and unlimited team seats.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited invoices & OCR scans</span>
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

      {/* 7. FAQ Section */}
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
              How does the WordPress & WooCommerce integration work?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Our official WordPress plugin hooks directly into WooCommerce. Whenever an order transitions to Processing
              or Completed, it makes a secured API call to your InvoiceAI account. The invoice is automatically created,
              assigned to the customer, and a "Download Tax Invoice (PDF)" button appears directly on the customer's
              receipt and email.
            </p>
          </div>

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
        </div>
      </section>

      {/* 8. Call To Action Footer Banner */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 border-t border-indigo-500/20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Wrestling with Invoices. Let AI Do the Heavy Lifting.
          </h2>
          <p className="text-sm text-indigo-200 max-w-xl mx-auto">
            Join forward-thinking businesses and stores already generating invoices in seconds with InvoiceAI.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold bg-white text-indigo-950 hover:bg-slate-100 shadow-2xl transition-all hover:scale-105"
            >
              <span>Get Started Now — It's Free</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </Link>
            <a
              href="/downloads/invoiceai-sync.zip"
              download="invoiceai-sync.zip"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-white transition-all"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Download WP Plugin</span>
            </a>
          </div>
        </div>
      </section>

      {/* 9. Comprehensive Footer */}
      <footer className="py-16 bg-slate-950 border-t border-slate-900 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
            {/* Brand Column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-white tracking-tight">
                  Invoice<span className="text-indigo-400">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Autonomous multi-tenant invoice and cash flow management SaaS. Built for businesses, freelancers, and
                e-commerce stores worldwide.
              </p>
              <div className="text-[11px] text-slate-600">
                © {new Date().getFullYear()} InvoiceAI Platform. All rights reserved.
              </div>
            </div>

            {/* Navigation Column */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#templates" className="hover:text-white transition-colors">
                    PDF Invoice Templates
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing Plans
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Developers & Integrations Column */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Developers</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => openDocs('api')}
                    className="hover:text-white transition-colors text-left flex items-center gap-1.5 text-indigo-400 font-semibold"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>REST API Documentation</span>
                  </button>
                </li>
                <li>
                  <a
                    href="/downloads/invoiceai-sync.zip"
                    download="invoiceai-sync.zip"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download WordPress Plugin (ZIP)</span>
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => openDocs('wordpress')}
                    className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                  >
                    <Plug className="w-3.5 h-3.5 text-purple-400" />
                    <span>WooCommerce Setup Guide</span>
                  </button>
                </li>
                <li>
                  <a href="#developers" className="hover:text-white transition-colors">
                    Interactive Code Snippets
                  </a>
                </li>
              </ul>
            </div>

            {/* Access & Account Column */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Create Free Account
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white transition-colors">
                    Merchant Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors text-rose-400">
                    Platform Super Admin
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <span>Powered by Next.js, NestJS, MySQL, and High-Precision Decimal Math.</span>
            <div className="flex items-center gap-4">
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>100% Tenant Isolation</span>
              <span>•</span>
              <span>cPanel Deployable</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. Interactive Documentation Modal */}
      {docsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">InvoiceAI Developer Hub</h3>
                  <p className="text-xs text-slate-400">
                    REST API integration reference & WordPress plugin installation instructions
                  </p>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setDocsModalTab('api')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      docsModalTab === 'api'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    REST API Docs
                  </button>
                  <button
                    onClick={() => setDocsModalTab('wordpress')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      docsModalTab === 'wordpress'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    WordPress Guide
                  </button>
                </div>

                <button
                  onClick={() => setDocsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Tab Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs text-slate-300 leading-relaxed font-sans">
              {docsModalTab === 'api' ? (
                /* TAB 1: REST API DOCS */
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white">1. Authentication</h4>
                    <p className="text-slate-400">
                      All external REST API endpoints require your organization's Live API key, provided via the{' '}
                      <code className="text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">X-API-KEY</code>{' '}
                      request header.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200">
                      X-API-KEY: inv_live_98d40e1f30a91c89dd2b758b299bbdcbc8410c6f0fbc0ed5
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-white">2. Base URLs</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Production API</span>
                        <code className="text-indigo-400 font-mono text-xs">https://your-domain.com/api/v1</code>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Local Development</span>
                        <code className="text-indigo-400 font-mono text-xs">http://localhost:4000/api/v1</code>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-white">3. Core API Endpoints</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                            <th className="p-3">Method</th>
                            <th className="p-3">Endpoint</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                          <tr>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                                GET
                              </span>
                            </td>
                            <td className="p-3 font-mono text-white">/api/v1/ping</td>
                            <td className="p-3 text-slate-400">Verifies API key and returns authenticated company name.</td>
                          </tr>
                          <tr>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300">
                                POST
                              </span>
                            </td>
                            <td className="p-3 font-mono text-white">/api/v1/invoices</td>
                            <td className="p-3 text-slate-400">
                              Creates an invoice, auto-syncs customer, calculates taxes, issues PDF links.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                                GET
                              </span>
                            </td>
                            <td className="p-3 font-mono text-white">/api/v1/invoices/:id/pdf</td>
                            <td className="p-3 text-slate-400">Directly downloads raw PDF binary stream.</td>
                          </tr>
                          <tr>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300">
                                POST
                              </span>
                            </td>
                            <td className="p-3 font-mono text-white">/api/v1/invoices/:id/payments</td>
                            <td className="p-3 text-slate-400">
                              Records checkout payment and marks invoice as PAID or PARTIALLY_PAID.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white">4. Sample Create Invoice JSON Payload</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                      <pre>{`POST /api/v1/invoices
Headers:
  Content-Type: application/json
  X-API-KEY: inv_live_...

Payload:
{
  "customer": {
    "name": "Acme Global Corp",
    "email": "billing@acme.com",
    "phone": "+1 555 123 4567",
    "country": "United States"
  },
  "currency": "USD",
  "referenceNumber": "ORDER-10024",
  "items": [
    {
      "name": "Cloud Hosting & Dedicated Server (Annual)",
      "quantity": 1,
      "unitPrice": 1200.00,
      "taxRate": 10
    }
  ],
  "autoIssue": true,
  "sendEmail": false
}`}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB 2: WORDPRESS GUIDE */
                <div className="space-y-6">
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Plug className="w-4 h-4 text-indigo-400" />
                        <span>Ready-to-Install WordPress Plugin</span>
                      </h4>
                      <p className="text-xs text-indigo-200/80 mt-0.5">
                        Download the zip package and upload directly into WordPress Admin.
                      </p>
                    </div>
                    <a
                      href="/downloads/invoiceai-sync.zip"
                      download="invoiceai-sync.zip"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download invoiceai-sync.zip</span>
                    </a>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-white">Step-by-Step Installation</h4>
                    <ol className="space-y-3 list-decimal list-inside text-slate-300">
                      <li>
                        <strong className="text-white">Upload Plugin:</strong> In WordPress Admin, navigate to{' '}
                        <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded font-mono">
                          Plugins &rarr; Add New &rarr; Upload Plugin
                        </code>
                        , choose <code className="text-slate-200">invoiceai-sync.zip</code>, and click Install Now.
                      </li>
                      <li>
                        <strong className="text-white">Activate:</strong> Click Activate Plugin once uploaded.
                      </li>
                      <li>
                        <strong className="text-white">Configure:</strong> Navigate to{' '}
                        <strong className="text-white">InvoiceAI</strong> in the WordPress admin menu.
                      </li>
                      <li>
                        <strong className="text-white">Paste API Key:</strong> Enter your API Endpoint (e.g.{' '}
                        <code className="text-slate-300 font-mono">https://your-domain.com/api/v1</code>) and your Live
                        API Key (<code className="text-indigo-400 font-mono">inv_live_...</code>).
                      </li>
                      <li>
                        <strong className="text-white">Test Connection:</strong> Click{' '}
                        <strong className="text-indigo-400">Test API Connection</strong> to confirm your company name is
                        verified, then click Save Settings.
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-base font-bold text-white">What Happens on Checkout?</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Whenever a customer pays for an order on WooCommerce, InvoiceAI automatically generates an official tax
                      invoice, maps the customer billing details, and embeds a "Download Tax Invoice (PDF)" button directly
                      on the WooCommerce thank-you page and in the customer's order receipt emails.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500">
                Need more help? Check the complete <code className="text-slate-400">API_DOCUMENTATION.md</code> in the repository.
              </span>
              <button
                onClick={() => setDocsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
