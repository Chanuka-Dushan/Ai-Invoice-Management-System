import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Download,
  ExternalLink,
  Code2,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Plug,
  Send,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const ApiIntegrationsPage: React.FC = () => {
  const { activeCompany } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'php' | 'python'>('curl');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  const apiEndpointUrl = `${API_BASE_URL}/api/v1`;

  useEffect(() => {
    fetchApiKey();
  }, [activeCompany?.id]);

  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/companies/active/api-key');
      setApiKey(res.data.apiKey || '');
    } catch (err) {
      console.error('Failed to fetch API key', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (
      !window.confirm(
        'Are you sure you want to regenerate your API Key? Any existing websites, plugins, or scripts using the current key will stop working immediately.',
      )
    ) {
      return;
    }

    try {
      setRegenerating(true);
      const res = await apiClient.post('/companies/active/api-key/regenerate');
      setApiKey(res.data.apiKey);
      setCopiedKey(false);
      setTestStatus(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate API key.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) return;
    try {
      setTestStatus({ loading: true });
      const res = await fetch(`${apiEndpointUrl}/ping`, {
        headers: { 'X-API-KEY': apiKey },
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTestStatus({
          loading: false,
          success: true,
          message: `Connected successfully to "${data.company.name}" (ID: ${data.company.id.slice(0, 8)}...)`,
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.message || 'API verification failed',
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Network error connecting to API',
      });
    }
  };

  // Code Samples Generator
  const getSnippets = () => {
    const key = apiKey || 'inv_live_YOUR_API_KEY';
    return {
      curl: `curl -X POST "${apiEndpointUrl}/invoices" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${key}" \\
  -d '{
    "customer": {
      "name": "Acme Global Corp",
      "email": "billing@acme.com",
      "phone": "+1 (555) 234-5678",
      "country": "United States"
    },
    "currency": "USD",
    "items": [
      {
        "name": "Cloud Hosting & Support (Annual)",
        "quantity": 1,
        "unitPrice": 1200.00,
        "taxRate": 10
      }
    ],
    "autoIssue": true,
    "sendEmail": true
  }'`,

      javascript: `// Node.js or Browser ES6
const createInvoice = async () => {
  const response = await fetch("${apiEndpointUrl}/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": "${key}"
    },
    body: JSON.stringify({
      customer: {
        name: "Acme Global Corp",
        email: "billing@acme.com",
        phone: "+1 (555) 234-5678"
      },
      currency: "USD",
      items: [
        {
          name: "Website Redesign & SEO Package",
          quantity: 1,
          unitPrice: 2500.00,
          taxRate: 5
        }
      ],
      autoIssue: true,
      sendEmail: true
    })
  });

  const data = await response.json();
  console.log("Invoice Created:", data.invoice.invoiceNumber);
  console.log("View Link:", data.invoice.publicUrl);
  console.log("PDF Stream:", data.invoice.pdfDownloadUrl);
};

createInvoice();`,

      php: `<?php
// WordPress / PHP Integration
$apiKey = '${key}';
$apiUrl = '${apiEndpointUrl}/invoices';

$payload = [
    'customer' => [
        'name'  => 'Acme Global Corp',
        'email' => 'billing@acme.com',
        'phone' => '+1 (555) 234-5678'
    ],
    'currency' => 'USD',
    'items' => [
        [
            'name'      => 'Custom E-Commerce Theme',
            'quantity'  => 1,
            'unitPrice' => 850.00,
            'taxRate'   => 0
        ]
    ],
    'autoIssue' => true,
    'sendEmail' => true
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
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
echo "Created Invoice: " . $result['invoice']['invoiceNumber'];
echo "PDF URL: " . $result['invoice']['pdfDownloadUrl'];
?>`,

      python: `import requests

API_KEY = "${key}"
API_URL = "${apiEndpointUrl}/invoices"

headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY
}

payload = {
    "customer": {
        "name": "Acme Global Corp",
        "email": "billing@acme.com",
        "phone": "+1 (555) 234-5678"
    },
    "currency": "USD",
    "items": [
        {
            "name": "Machine Learning API Access",
            "quantity": 10,
            "unitPrice": 50.00,
            "taxRate": 8.5
        }
    ],
    "autoIssue": True,
    "sendEmail": True
}

res = requests.post(API_URL, json=payload, headers=headers)
data = res.json()

print(f"Status: {res.status_code}")
print(f"Invoice Number: {data['invoice']['invoiceNumber']}")
print(f"Public Link: {data['invoice']['publicUrl']}")
print(f"Direct PDF: {data['invoice']['pdfDownloadUrl']}")
`,
    };
  };

  const snippets = getSnippets();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Plug className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API & Integrations</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect external web apps, custom stores, and WordPress/WooCommerce directly to your{' '}
            <span className="font-semibold text-slate-700">{activeCompany?.name || 'Company'}</span> workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/downloads/invoiceai-sync.zip"
            download="invoiceai-sync.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Download WP Plugin
          </a>
        </div>
      </div>

      {/* API Key Management Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Your Live API Key</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active & Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pass this key in the <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">X-API-KEY</code>{' '}
              request header for all external API calls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={loading || testStatus?.loading || !apiKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Plug className={`w-3.5 h-3.5 ${testStatus?.loading ? 'animate-spin' : ''}`} />
              Test Key Connection
            </button>
            <button
              onClick={handleRegenerateKey}
              disabled={loading || regenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate Key
            </button>
          </div>
        </div>

        {/* API Key Display Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 bg-slate-900 text-slate-100 rounded-xl px-4 py-3 font-mono text-sm tracking-wide flex items-center justify-between overflow-hidden border border-slate-800">
            <div className="truncate select-all">
              {loading ? (
                <span className="text-slate-500">Loading API key...</span>
              ) : showKey ? (
                apiKey || 'No key generated'
              ) : (
                apiKey ? `${apiKey.slice(0, 12)}••••••••••••••••••••••••••••••••••••••••` : 'None'
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="ml-2 text-slate-400 hover:text-white transition p-1"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => handleCopy(apiKey, 'key')}
            disabled={!apiKey || loading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition shrink-0"
          >
            {copiedKey ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Key</span>
              </>
            )}
          </button>
        </div>

        {/* Test Connection Result Alert */}
        {testStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
              testStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold">{testStatus.success ? 'Connectivity Verified: ' : 'Error: '}</span>
              {testStatus.message}
            </div>
          </div>
        )}

        {/* Base URL info */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            <span className="font-semibold text-slate-700">API Base URL: </span>
            <code className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono select-all">
              {apiEndpointUrl}
            </code>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Format: </span>
            <span>JSON (application/json)</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Rate Limit: </span>
            <span>120 requests / min</span>
          </div>
        </div>
      </div>

      {/* WordPress & WooCommerce Plugin Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Official Integration
            </span>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/30 text-purple-200 border border-purple-400/30">
              WooCommerce Verified
            </span>
            <span className="text-xs text-indigo-300 font-mono">v1.0.0</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              InvoiceAI WordPress & WooCommerce Sync Plugin
            </h2>
            <p className="text-sm text-indigo-200/80 leading-relaxed">
              Automate your entire invoicing cycle. When a customer places an order on your WooCommerce store, this
              plugin automatically creates a matching tax invoice in your InvoiceAI company, generates a branded PDF, and
              places instant download buttons on the customer order receipt and email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Zero Extra Setup</h4>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Paste your API Key and endpoint. Auto-syncs customers and orders immediately.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <FileCode className="w-4 h-4 text-cyan-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">PDF Invoice Links</h4>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Adds a "Download Official Tax Invoice (PDF)" button on WooCommerce Order screens.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-indigo-300 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Isolated Tenant Safety</h4>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Every transaction is securely isolated to your company organization.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="/downloads/invoiceai-sync.zip"
              download="invoiceai-sync.zip"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm rounded-xl shadow transition"
            >
              <Download className="w-4 h-4" />
              Download invoiceai-sync.zip
            </a>
            <span className="text-xs text-indigo-300">
              Ready to install via WordPress Dashboard → Plugins → Add New → Upload Plugin.
            </span>
          </div>
        </div>
      </div>

      {/* Code Integration Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Interactive Integration Code Examples</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test creating an invoice programmatically from your backend, custom scripts, or external systems.
            </p>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['curl', 'javascript', 'php', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  selectedLanguage === lang
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'javascript' ? 'JavaScript' : lang === 'curl' ? 'cURL' : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content Box */}
        <div className="relative bg-slate-950 p-6 text-slate-100 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => handleCopy(snippets[selectedLanguage], selectedLanguage)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
          >
            {copiedSnippet === selectedLanguage ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          <pre className="pr-16 leading-relaxed select-all">{snippets[selectedLanguage]}</pre>
        </div>
      </div>

      {/* REST API Endpoints Quick Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">REST API Endpoints Reference</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All endpoints require the <code className="text-indigo-600 font-mono">X-API-KEY</code> header.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Payload / Params</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    GET
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/ping</td>
                <td className="py-3 px-3">Verifies API key validity and returns company metadata.</td>
                <td className="py-3 px-3 text-slate-400">—</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-indigo-100 text-indigo-800">
                    POST
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/invoices</td>
                <td className="py-3 px-3">Creates an invoice, auto-syncs customer, and generates PDF view link.</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-600">
                  {`{ customer, items, currency, autoIssue, sendEmail }`}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    GET
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/invoices</td>
                <td className="py-3 px-3">Lists invoices for the authenticated company with pagination.</td>
                <td className="py-3 px-3 text-slate-500">?page=1&limit=20&status=ISSUED</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    GET
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/invoices/:id</td>
                <td className="py-3 px-3">Retrieves invoice data, line items, and public URL by ID or number.</td>
                <td className="py-3 px-3 text-slate-400">—</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    GET
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/invoices/:id/pdf</td>
                <td className="py-3 px-3">Directly downloads raw PDF binary stream for the invoice.</td>
                <td className="py-3 px-3 text-slate-400">Streams application/pdf</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-indigo-100 text-indigo-800">
                    POST
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/invoices/:id/payments</td>
                <td className="py-3 px-3">Records payment, updates balance, and transitions status to PAID.</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-600">
                  {`{ amount, paymentMethod, transactionReference }`}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    GET
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-slate-900">/api/v1/customers</td>
                <td className="py-3 px-3">Lists all customers registered under your company.</td>
                <td className="py-3 px-3 text-slate-500">?search=acme&limit=50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
