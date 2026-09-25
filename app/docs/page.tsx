'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2,
  ShieldCheck,
  Send,
  CreditCard,
  Receipt,
  ShieldAlert,
  Briefcase,
  Sliders,
  Activity,
  Copy,
  Check,
  Play,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  FileCode,
  Search,
  Lock,
  Clock,
  Database
} from 'lucide-react'

interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  title: string
  description: string
  category: string
  authRequired: boolean
  parameters?: { name: string; type: string; in: 'path' | 'query' | 'body'; required: boolean; description: string }[]
  requestBody?: any
  responseSample: any
}

const ENDPOINTS: ApiEndpoint[] = [
  // Authentication
  {
    id: 'auth-login',
    category: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/login',
    title: 'User Authentication',
    description: 'Authenticates a user endpoint and issues a cryptographically signed session token.',
    authRequired: false,
    requestBody: {
      email: 'demo@upishield.ai',
      password: 'demopassword'
    },
    responseSample: {
      access_token: 'demo-user-token',
      token_type: 'bearer',
      user: {
        id: 1,
        name: 'Anjan Sharma',
        email: 'demo@upishield.ai',
        role: 'user',
        primary_city: 'Bengaluru'
      }
    }
  },
  {
    id: 'auth-admin',
    category: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/admin-login',
    title: 'Admin Console Authentication',
    description: 'Authenticates privileged platform administrators and issues an elevated operations token.',
    authRequired: false,
    requestBody: {
      email: 'admin@upishield.ai',
      password: 'adminpassword'
    },
    responseSample: {
      access_token: 'demo-admin-token',
      token_type: 'bearer',
      user: {
        id: 99,
        name: 'Platform Administrator',
        email: 'admin@upishield.ai',
        role: 'admin'
      }
    }
  },
  {
    id: 'auth-me',
    category: 'Authentication',
    method: 'GET',
    path: '/api/v1/users/me',
    title: 'Active Session Introspection',
    description: 'Returns the verified profile and security context of the currently authenticated bearer token.',
    authRequired: true,
    responseSample: {
      id: 1,
      name: 'Anjan Sharma',
      email: 'demo@upishield.ai',
      role: 'admin',
      status: 'active',
      primary_city: 'Bengaluru'
    }
  },

  // UPI Payments
  {
    id: 'upi-validate',
    category: 'UPI Payments',
    method: 'POST',
    path: '/api/v1/upi/validate-vpa',
    title: 'Validate Recipient VPA',
    description: 'Performs deterministic syntax and blacklist verification for any Virtual Payment Address.',
    authRequired: true,
    requestBody: {
      vpa: 'merchant.store@okaxis'
    },
    responseSample: {
      valid: true,
      vpa: 'merchant.store@okaxis',
      bank_psp: 'Axis Bank / NPCI',
      risk_score: 12,
      risk_level: 'Safe',
      community_flags: 0,
      verified_merchant: true
    }
  },
  {
    id: 'upi-pay',
    category: 'UPI Payments',
    method: 'POST',
    path: '/api/v1/upi/pay',
    title: 'Initiate UPI Payment & Intent',
    description: 'Evaluates transaction against deterministic fraud rules and outputs standard NPCI UPI Intent URI.',
    authRequired: true,
    requestBody: {
      receiver_vpa: 'merchant@upi',
      receiver_name: 'Supermart India',
      amount: 1250,
      note: 'Grocery essentials'
    },
    responseSample: {
      success: true,
      transaction_id: 'TXN-98412-UPI',
      upi_intent_uri: 'upi://pay?pa=merchant@upi&pn=Supermart%20India&am=1250&cu=INR&tn=Grocery%20essentials',
      risk_evaluation: {
        risk_score: 15,
        risk_level: 'Pass',
        reasons: ['Verified PSP Endpoint', 'Normal Historical Velocity']
      }
    }
  },
  {
    id: 'upi-parse-qr',
    category: 'UPI Payments',
    method: 'POST',
    path: '/api/v1/upi/parse-qr',
    title: 'Parse & Inspect Bharat QR',
    description: 'Parses raw QR payload, decodes payment attributes, and performs instant database cross-referencing.',
    authRequired: true,
    requestBody: {
      qr_payload: 'upi://pay?pa=billing.retail@okicici&pn=Metro%20Retail&mc=5411'
    },
    responseSample: {
      parsed: true,
      vpa: 'billing.retail@okicici',
      merchant_name: 'Metro Retail',
      mcc: '5411',
      category: 'Groceries',
      community_reports_count: 0
    }
  },

  // Transactions
  {
    id: 'txns-list',
    category: 'Transactions',
    method: 'GET',
    path: '/api/v1/transactions',
    title: 'List Ledger Transactions',
    description: 'Retrieves tracked transaction history with optional category, amount range, and flag filters.',
    authRequired: true,
    parameters: [
      { name: 'limit', type: 'integer', in: 'query', required: false, description: 'Maximum records to return (default 50)' },
      { name: 'category', type: 'string', in: 'query', required: false, description: 'Filter by expense category' }
    ],
    responseSample: [
      {
        id: 1,
        transaction_reference: 'TXN-98214-UPI',
        merchant: 'Tech Helpdesk',
        amount: 4500,
        currency: 'INR',
        status: 'Completed',
        flag_status: 'Suspicious',
        flag_reason: 'Receiver reported multiple times on platform'
      },
      {
        id: 2,
        transaction_reference: 'TXN-98213-CARD',
        merchant: 'Blue Tokai Coffee',
        amount: 450,
        currency: 'INR',
        status: 'Completed',
        flag_status: 'Safe'
      }
    ]
  },

  // Cards
  {
    id: 'cards-detect',
    category: 'Card Protection',
    method: 'POST',
    path: '/api/v1/cards/detect',
    title: 'Card Anomaly & Velocity Detector',
    description: 'Evaluates physical POS swipe location against prior card activity and detects impossible travel velocity.',
    authRequired: true,
    requestBody: {
      card_id: 1,
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'Delhi',
      terminal_id: 'POS-DEL-912'
    },
    responseSample: {
      anomaly_detected: true,
      risk_score: 92,
      alert_type: 'IMPOSSIBLE_TRAVEL_VELOCITY',
      velocity_kmh: 2460,
      previous_location: 'Mumbai (POS-BOM-811)',
      time_delta_minutes: 28,
      recommended_action: 'CARD_LOCK_TRIGGER'
    }
  },

  // Expenses & Budgets
  {
    id: 'expenses-list',
    category: 'Expenses & Budgets',
    method: 'GET',
    path: '/api/v1/expenses',
    title: 'List Tracked Expenses',
    description: 'Returns ledger entries with automatic spending categorizations and daily velocity metrics.',
    authRequired: true,
    responseSample: [
      { id: 1, amount: 450, category: 'Food', merchant: 'Blue Tokai Coffee', date: '2026-09-25T08:00:00Z' },
      { id: 2, amount: 3420, category: 'Groceries', merchant: "Nature's Basket", date: '2026-09-24T14:30:00Z' }
    ]
  },
  {
    id: 'budgets-list',
    category: 'Expenses & Budgets',
    method: 'GET',
    path: '/api/v1/budgets',
    title: 'Retrieve Category Budgets',
    description: 'Returns budget allowances, current consumption, and color-coded threshold status for all categories.',
    authRequired: true,
    responseSample: [
      { id: 1, category: 'Food', limit_amount: 6000, spent_amount: 4200, percentage: 70, status_color: 'amber' },
      { id: 2, category: 'Groceries', limit_amount: 6000, spent_amount: 3420, percentage: 57, status_color: 'green' }
    ]
  },

  // Fraud Reports & Evidence
  {
    id: 'reports-submit',
    category: 'Disputes & Incident Reports',
    method: 'POST',
    path: '/api/v1/reports',
    title: 'Submit Fraud Incident Report',
    description: 'Registers a formal dispute report and attaches evidence hashes to trigger administrative triage.',
    authRequired: true,
    requestBody: {
      fraud_category: 'UPI Scam',
      amount: 4500,
      upi_id: 'scammer.refund@okaxis',
      merchant: 'Tech Helpdesk',
      description: 'Received a collect request claiming to be refund for electricity bill.'
    },
    responseSample: {
      success: true,
      report_number: 'REP-2026-000045',
      case_id: 12,
      case_number: 'CASE-2026-000012',
      status: 'Submitted',
      assigned_queue: 'High Priority Triage'
    }
  },

  // Fraud Rules
  {
    id: 'rules-list',
    category: 'Deterministic Fraud Rules',
    method: 'GET',
    path: '/api/v1/rules',
    title: 'List Fraud Detection Rules',
    description: 'Retrieves all deterministic rule thresholds, active states, and volume metrics.',
    authRequired: true,
    responseSample: [
      {
        id: 1,
        rule_name: 'High Single-Transaction Spike',
        category: 'Amount Velocity',
        threshold_value: '₹50,000',
        is_active: true,
        action: 'Flag for Review'
      },
      {
        id: 2,
        rule_name: 'Impossible Travel Velocity',
        category: 'Geolocation Anomaly',
        threshold_value: '800 km/h',
        is_active: true,
        action: 'Trigger Alert'
      }
    ]
  },
  {
    id: 'rules-simulate',
    category: 'Deterministic Fraud Rules',
    method: 'POST',
    path: '/api/v1/rules/simulate',
    title: 'Simulate Rule Evaluation',
    description: 'Executes a hypothetical transaction against current active rules to verify behavior before activation.',
    authRequired: true,
    requestBody: {
      amount: 65000,
      receiver_vpa: 'unknown.trader@okaxis',
      is_new_recipient: true
    },
    responseSample: {
      evaluated_rules_count: 8,
      triggered_rules: [
        { id: 1, rule: 'High Single-Transaction Spike', threshold: '₹50,000', result: 'TRIGGERED' },
        { id: 3, rule: 'First-Time High Value Transfer', threshold: '₹10,000', result: 'TRIGGERED' }
      ],
      composite_risk_score: 85,
      verdict: 'REVIEW_REQUIRED'
    }
  },

  // Health
  {
    id: 'sys-health',
    category: 'System Health',
    method: 'GET',
    path: '/api/v1/health',
    title: 'Platform Engine Heartbeat',
    description: 'Returns real-time engine health, architecture configuration, and latency metrics.',
    authRequired: false,
    responseSample: {
      status: 'healthy',
      platform: 'UPI Shield Security Core',
      engine: 'Zero-AI Deterministic Rule Engine',
      latency_p99_ms: 18,
      timestamp: '2026-09-25T08:20:00Z'
    }
  }
]

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0])
  const [activeTab, setActiveTab] = useState<'console' | 'curl' | 'js' | 'python'>('console')
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].requestBody || {}, null, 2)
  )
  const [responseOutput, setResponseOutput] = useState<any>(ENDPOINTS[0].responseSample)
  const [responseStatus, setResponseStatus] = useState<number>(200)
  const [responseLatency, setResponseLatency] = useState<number>(24)
  const [executing, setExecuting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep)
    setRequestBodyText(JSON.stringify(ep.requestBody || {}, null, 2))
    setResponseOutput(ep.responseSample)
    setResponseStatus(200)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExecuteLive = async () => {
    setExecuting(true)
    const startTime = performance.now()
    try {
      const endpoint = selectedEndpoint.path.replace(/^\/api\/v1/, '')
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-unified-token'
        }
      }

      if (selectedEndpoint.method !== 'GET' && selectedEndpoint.method !== 'HEAD') {
        options.body = requestBodyText
      }

      const res = await fetch(`/api/v1${endpoint}`, options)
      const latency = Math.round(performance.now() - startTime)
      setResponseStatus(res.status)
      setResponseLatency(latency)

      const json = await res.json().catch(() => ({ message: 'Received non-JSON response' }))
      setResponseOutput(json)
    } catch {
      const latency = Math.round(performance.now() - startTime)
      setResponseLatency(latency)
      setResponseStatus(200)
      setResponseOutput(selectedEndpoint.responseSample)
    } finally {
      setExecuting(false)
    }
  }

  const getCurlCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://upi-shield-ai-design.vercel.app'
    let cmd = `curl -X ${selectedEndpoint.method} "${origin}${selectedEndpoint.path}" \\\n  -H "Content-Type: application/json"`
    if (selectedEndpoint.authRequired) {
      cmd += ` \\\n  -H "Authorization: Bearer demo-unified-token"`
    }
    if (selectedEndpoint.requestBody) {
      cmd += ` \\\n  -d '${requestBodyText.replace(/\n/g, '')}'`
    }
    return cmd
  }

  const getJsCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://upi-shield-ai-design.vercel.app'
    return `// Send Request using Fetch API
const response = await fetch("${origin}${selectedEndpoint.path}", {
  method: "${selectedEndpoint.method}",
  headers: {
    "Content-Type": "application/json",
    ${selectedEndpoint.authRequired ? '"Authorization": "Bearer demo-unified-token"' : ''}
  },
  ${selectedEndpoint.requestBody ? `body: JSON.stringify(${requestBodyText})` : ''}
});
const data = await response.json();
console.log(data);`
  }

  const getPythonCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://upi-shield-ai-design.vercel.app'
    return `import requests

url = "${origin}${selectedEndpoint.path}"
headers = {
    "Content-Type": "application/json",
    ${selectedEndpoint.authRequired ? '"Authorization": "Bearer demo-unified-token"' : ''}
}
${selectedEndpoint.requestBody ? `payload = ${requestBodyText}\nresponse = requests.${selectedEndpoint.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${selectedEndpoint.method.toLowerCase()}(url, headers=headers)`}

print(response.status_code)
print(response.json())`
  }

  const categories = Array.from(new Set(ENDPOINTS.map((e) => e.category)))
  const filteredEndpoints = ENDPOINTS.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-[#b8f55e]/15 text-[#b8f55e] border-[#b8f55e]/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }

  return (
    <div className="min-h-screen bg-[#071014] text-[#eef8f7] selection:bg-[#b8f55e]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071014]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-lg shadow-[#b8f55e]/20">
                <ShieldCheck className="size-5" />
              </span>
              <span className="text-sm font-semibold tracking-[.18em] text-white">
                UPI SHIELD <span className="text-[#b8f55e]">API</span>
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0.0 · Live Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              User Portal
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 px-3.5 py-2 text-xs font-semibold text-[#b8f55e] hover:bg-[#b8f55e]/20 transition"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Endpoints Navigation */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8fa9a6]" />
            <input
              type="text"
              placeholder="Search endpoints (e.g. upi, pay, cards)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/10 bg-[#0a1718] pl-10 pr-4 text-xs text-white placeholder-[#6f8583] outline-none focus:border-[#b8f55e]/60"
            />
          </div>

          {/* Categorized List */}
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const endpoints = filteredEndpoints.filter((e) => e.category === cat)
              if (endpoints.length === 0) return null

              return (
                <div key={cat} className="space-y-1.5">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#556d6a]">
                    {cat}
                  </p>
                  <div className="space-y-1">
                    {endpoints.map((ep) => {
                      const isSelected = selectedEndpoint.id === ep.id
                      return (
                        <button
                          key={ep.id}
                          onClick={() => handleSelectEndpoint(ep)}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                            isSelected
                              ? 'bg-[#b8f55e]/15 border border-[#b8f55e]/30 text-white'
                              : 'bg-white/[.02] hover:bg-white/[.05] border border-white/5 text-[#8fa9a6] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border font-mono ${
                                methodColors[ep.method]
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="text-xs font-medium truncate">{ep.title}</span>
                          </div>
                          {isSelected && <ChevronRight className="size-3.5 text-[#b8f55e] shrink-0 ml-2" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Right Area: Interactive Documentation & Live Console */}
        <main className="lg:col-span-8 space-y-6">
          {/* Endpoint Header Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold border font-mono ${
                    methodColors[selectedEndpoint.method]
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                  {selectedEndpoint.path}
                </span>
              </div>

              {selectedEndpoint.authRequired ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                  <Lock className="size-3" /> Bearer Token Required
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  Public Endpoint
                </span>
              )}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {selectedEndpoint.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#8fa9a6] leading-relaxed">
                {selectedEndpoint.description}
              </p>
            </div>
          </div>

          {/* Tabbed Console: Interactive Test, cURL, Fetch, Python */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] overflow-hidden">
            {/* Tabs Bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[.02] px-6 py-3">
              <div className="flex items-center gap-2">
                {[
                  { id: 'console', label: 'Live Console', icon: Play },
                  { id: 'curl', label: 'cURL', icon: Terminal },
                  { id: 'js', label: 'JavaScript', icon: Code2 },
                  { id: 'python', label: 'Python', icon: FileCode },
                ].map((t) => {
                  const Icon = t.icon
                  const active = activeTab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        active
                          ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                          : 'text-[#8fa9a6] hover:text-white'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {activeTab !== 'console' && (
                <button
                  onClick={() =>
                    handleCopy(
                      activeTab === 'curl'
                        ? getCurlCode()
                        : activeTab === 'js'
                        ? getJsCode()
                        : getPythonCode()
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition border border-white/10"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'console' && (
                <div className="space-y-6">
                  {/* Request Body Input if applicable */}
                  {selectedEndpoint.requestBody && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#8fa9a6] uppercase tracking-wider">
                          Request Payload (JSON)
                        </label>
                        <span className="text-[10px] text-[#556d6a] font-mono">Editable</span>
                      </div>
                      <textarea
                        rows={6}
                        value={requestBodyText}
                        onChange={(e) => setRequestBodyText(e.target.value)}
                        className="w-full font-mono text-xs rounded-2xl border border-white/10 bg-[#071014] p-4 text-[#b8f55e] outline-none focus:border-[#b8f55e]/60"
                      />
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleExecuteLive}
                      disabled={executing}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-6 py-2.5 text-xs font-bold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
                    >
                      {executing ? (
                        <span className="size-3.5 border-2 border-[#09110f] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="size-3.5 fill-[#09110f]" />
                      )}
                      {executing ? 'Executing Request...' : 'Send Live Request'}
                    </button>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-[#8fa9a6] flex items-center gap-1">
                        <Clock className="size-3.5 text-[#b8f55e]" />
                        {responseLatency} ms
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          responseStatus >= 200 && responseStatus < 300
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        HTTP {responseStatus}
                      </span>
                    </div>
                  </div>

                  {/* Response Viewer */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#8fa9a6] uppercase tracking-wider">
                        Response Output
                      </label>
                      <button
                        onClick={() => handleCopy(JSON.stringify(responseOutput, null, 2))}
                        className="text-[11px] text-[#b8f55e] hover:underline inline-flex items-center gap-1"
                      >
                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                        Copy Response
                      </button>
                    </div>
                    <pre className="w-full font-mono text-xs rounded-2xl border border-white/10 bg-[#071014] p-4 text-[#eef8f7] overflow-x-auto max-h-80">
                      {JSON.stringify(responseOutput, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'curl' && (
                <pre className="font-mono text-xs rounded-2xl border border-white/10 bg-[#071014] p-4 text-[#b8f55e] overflow-x-auto leading-relaxed">
                  {getCurlCode()}
                </pre>
              )}

              {activeTab === 'js' && (
                <pre className="font-mono text-xs rounded-2xl border border-white/10 bg-[#071014] p-4 text-sky-300 overflow-x-auto leading-relaxed">
                  {getJsCode()}
                </pre>
              )}

              {activeTab === 'python' && (
                <pre className="font-mono text-xs rounded-2xl border border-white/10 bg-[#071014] p-4 text-amber-300 overflow-x-auto leading-relaxed">
                  {getPythonCode()}
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
