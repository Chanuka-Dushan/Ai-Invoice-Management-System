import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  kpis?: Record<string, any>;
  invoices?: any[];
  timestamp: string;
}

export const AiAssistantPage: React.FC = () => {
  const { activeCompany, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.firstName || 'there'}! I am your InvoiceAI Financial Assistant for ${activeCompany?.name}. You can ask me questions about your revenue, overdue invoices, debtors, or supplier expenses.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const suggestedQuestions = [
    'How much revenue did I generate this month?',
    'Show me all overdue invoices.',
    'Which customers have outstanding payments?',
    'Summarize my income and expenses.',
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isAsking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      const res = await apiClient.post('/ai/assistant/ask', { query: queryText.trim() });
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.data.answer,
        kpis: res.data.kpis,
        invoices: res.data.invoices,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I encountered an error checking your business database. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI Financial Assistant</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query company revenue, debtors, cashflow, and expenses using natural language.
          </p>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 overflow-y-auto space-y-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Data Card Attachments if provided */}
              {m.kpis && Object.keys(m.kpis).length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                  {Object.entries(m.kpis).map(([k, v]) => (
                    <div key={k} className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-black text-slate-900 text-sm">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices or Debtors List */}
              {m.invoices && m.invoices.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                  {m.invoices.map((inv: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800">
                        {inv.name || inv.invoiceNumber}
                      </span>
                      <span className="font-bold text-rose-600">
                        {inv.balance !== undefined ? inv.balance : inv.outstandingBalance}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className={`text-[10px] ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                {m.timestamp}
              </p>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {isAsking && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing business financial records...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Prompts:</span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-xs bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors shadow-2xs font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="relative"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a financial question, e.g. 'Show me all overdue invoices'..."
          className="w-full pl-5 pr-14 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isAsking}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

