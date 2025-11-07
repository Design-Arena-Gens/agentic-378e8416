'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, Copy, Clock, AlertTriangle, Sparkles, Send, X, ChevronRight, Download, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  html?: string;
  timestamp: number;
  read: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}

interface AIInsight {
  summary?: string[];
  phishingRisk?: 'Low' | 'Medium' | 'High';
  suggestions?: string[];
}

const TTL_OPTIONS = [
  { label: '10 मिनट', value: 600000 },
  { label: '1 घंटा', value: 3600000 },
  { label: '6 घंटे', value: 21600000 },
  { label: '24 घंटे', value: 86400000 },
];

export default function Home() {
  const [email, setEmail] = useState<string>('');
  const [inbox, setInbox] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [ttl, setTtl] = useState(3600000);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const wsRef = useRef<any>(null);

  useEffect(() => {
    generateEmail();
    setupWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    inbox.forEach((msg) => {
      const timeLeft = ttl - (Date.now() - msg.timestamp);
      if (timeLeft > 0) {
        const interval = setTimeout(() => {
          setInbox((prev) => prev.filter((m) => m.id !== msg.id));
        }, timeLeft);
        intervals.push(interval);
      }
    });
    return () => intervals.forEach(clearTimeout);
  }, [inbox, ttl]);

  const setupWebSocket = () => {
    // Simulated WebSocket connection
    const mockWs = {
      close: () => {},
    };
    wsRef.current = mockWs;

    // Simulate incoming email after 5 seconds
    setTimeout(() => {
      const mockEmail: Email = {
        id: Math.random().toString(36).substr(2, 9),
        from: 'welcome@service.com',
        subject: 'Welcome to InstantTempMail!',
        body: 'Thank you for using our service. Your temporary email is ready to receive messages.',
        timestamp: Date.now(),
        read: false,
      };
      setInbox((prev) => [mockEmail, ...prev]);
    }, 5000);
  };

  const generateEmail = () => {
    const randomStr = Math.random().toString(36).substring(2, 10);
    const domain = 'tempmail.dev';
    setEmail(`${randomStr}@${domain}`);
  };

  const rotateEmail = () => {
    setLoading(true);
    setInbox([]);
    setSelectedEmail(null);
    setAiInsights({});
    setTimeout(() => {
      generateEmail();
      setLoading(false);
    }, 500);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectEmail = async (msg: Email) => {
    setSelectedEmail(msg);
    setInbox((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
    );

    // Get AI insights
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          email: msg,
        }),
      });
      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
    setAiLoading(false);
  };

  const getEmailSuggestions = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggestions',
        }),
      });
      const data = await response.json();
      setAiInsights({ suggestions: data.suggestions });
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
    setAiLoading(false);
  };

  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt: aiPrompt,
          context: selectedEmail,
        }),
      });
      const data = await response.json();
      setAiInsights((prev) => ({
        ...prev,
        suggestions: [data.response],
      }));
    } catch (error) {
      console.error('AI chat failed:', error);
    }
    setAiLoading(false);
    setAiPrompt('');
  };

  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InstantTempMail
              </h1>
            </div>
            <button
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          </div>

          {/* Email Address Section */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-gray-50 border-2 border-indigo-200 rounded-lg px-4 py-3 font-mono text-sm sm:text-base text-gray-800 flex items-center justify-between">
                <span className="truncate">{email}</span>
                <button
                  onClick={copyToClipboard}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={rotateEmail}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>बदलें</span>
              </button>
            </div>

            {copied && (
              <div className="text-green-600 text-sm text-center fade-in">
                ✓ Copied to clipboard!
              </div>
            )}

            {/* TTL Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">समाप्ति:</span>
              {TTL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTtl(option.value)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    ttl === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Inbox List */}
        <div className={`${selectedEmail ? 'hidden sm:block' : 'block'} w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white overflow-y-auto`}>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Inbox ({inbox.length})
            </h2>
          </div>

          {inbox.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>कोई ईमेल नहीं</p>
              <p className="text-sm mt-2">नए संदेशों की प्रतीक्षा में...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inbox.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => selectEmail(msg)}
                  className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors ${
                    !msg.read ? 'bg-blue-50' : 'bg-white'
                  } ${selectedEmail?.id === msg.id ? 'border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`font-semibold text-sm truncate ${!msg.read ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {msg.from}
                    </p>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!msg.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">{msg.body.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Viewer */}
        <div className={`${selectedEmail ? 'block' : 'hidden sm:block'} flex-1 bg-white overflow-y-auto`}>
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="sm:hidden mb-4 text-indigo-600 flex items-center gap-1"
                >
                  ← Back
                </button>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <p className="font-semibold">From: {selectedEmail.from}</p>
                    <p>{formatDistanceToNow(selectedEmail.timestamp, { addSuffix: true })}</p>
                  </div>
                  <button
                    onClick={() => setInbox((prev) => prev.filter((m) => m.id !== selectedEmail.id))}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {selectedEmail.html ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedEmail.html) }}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
                )}

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-5 h-5 text-indigo-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{att.filename}</p>
                            <p className="text-xs text-gray-500">{(att.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">कोई ईमेल चुनें</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Sidebar */}
        <div
          className={`${
            aiSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } fixed sm:relative right-0 top-0 h-full w-full sm:w-96 bg-gradient-to-br from-indigo-50 to-purple-50 border-l border-indigo-200 transition-transform duration-300 ease-in-out z-20 flex flex-col`}
        >
          <div className="p-4 border-b border-indigo-200 bg-white/50 backdrop-blur flex items-center justify-between">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Assistant
            </h3>
            <button
              onClick={() => setAiSidebarOpen(false)}
              className="sm:hidden text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiLoading && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="shimmer h-4 rounded mb-2"></div>
                <div className="shimmer h-4 rounded w-3/4"></div>
              </div>
            )}

            {selectedEmail && aiInsights.phishingRisk && (
              <div
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  aiInsights.phishingRisk === 'High'
                    ? 'border-red-500'
                    : aiInsights.phishingRisk === 'Medium'
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      aiInsights.phishingRisk === 'High'
                        ? 'text-red-500'
                        : aiInsights.phishingRisk === 'Medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  />
                  <span className="font-semibold">Phishing Risk: {aiInsights.phishingRisk}</span>
                </div>
              </div>
            )}

            {selectedEmail && aiInsights.summary && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2 text-indigo-900">Summary</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {aiInsights.summary.map((point, idx) => (
                    <li key={idx} className="flex gap-2">
                      <ChevronRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsights.suggestions && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2 text-indigo-900">Suggestions</h4>
                <div className="space-y-2">
                  {aiInsights.suggestions.map((sugg, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-indigo-50 p-2 rounded">
                      {sugg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedEmail && (
              <div className="space-y-3">
                <button
                  onClick={getEmailSuggestions}
                  disabled={aiLoading}
                  className="w-full bg-white hover:bg-indigo-50 text-indigo-900 font-semibold py-3 px-4 rounded-lg shadow-sm transition-all border border-indigo-200 disabled:opacity-50"
                >
                  Username सुझाव प्राप्त करें
                </button>
                <div className="bg-white/50 rounded-lg p-4 text-sm text-gray-600">
                  <p>💡 AI Assistant आपकी मदद कर सकता है:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>ईमेल summarize करना</li>
                    <li>Phishing detect करना</li>
                    <li>Username suggestions देना</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-indigo-200 bg-white/50 backdrop-blur">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiPrompt()}
                placeholder="AI से पूछें..."
                className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAiPrompt}
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
