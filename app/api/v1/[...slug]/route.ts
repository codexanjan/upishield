import { NextRequest, NextResponse } from 'next/server'
import {
  evaluateDynamicRisk,
  normalizeCrossUpiPayload,
  MODEL_PERFORMANCE_METRICS,
  FRAUD_NETWORK_GRAPH_DATA,
  DEFAULT_USER_BASELINE,
  calculateAdaptiveThreshold
} from '@/lib/ai-fraud-engine'

// Seed / in-memory store for serverless demo mode on Vercel
const demoState = {
  users: [
    {
      id: 1,
      name: 'Anjan Sharma',
      email: 'user@upishield.com',
      mobile: '+91 98765 43210',
      role: 'user',
      status: 'active',
      joined: '2026-09-01T10:00:00Z',
      transactions_count: 24,
      reports_count: 2,
      cases_count: 2
    },
    {
      id: 2,
      name: 'Priya Verma',
      email: 'priya.v@example.com',
      mobile: '+91 98111 22334',
      role: 'user',
      status: 'active',
      joined: '2026-09-05T14:30:00Z',
      transactions_count: 12,
      reports_count: 1,
      cases_count: 1
    }
  ],
  transactions: [
    {
      id: 1,
      transaction_reference: 'TXN-98214-UPI',
      user_id: 1,
      merchant: 'Tech Helpdesk',
      amount: 4500,
      currency: 'INR',
      transaction_type: 'UPI',
      payment_method: 'UPI App Intent',
      transaction_date: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'Completed',
      flag_status: 'Suspicious',
      flag_reason: 'Receiver reported multiple times on platform',
      has_report: true,
      upi_details: {
        receiver_name: 'Tech Helpdesk',
        receiver_upi: 'scammer.refund@okaxis'
      }
    },
    {
      id: 2,
      transaction_reference: 'TXN-98213-CARD',
      user_id: 1,
      merchant: 'Overseas Digital Store',
      amount: 12999,
      currency: 'INR',
      transaction_type: 'Card',
      payment_method: 'Credit Card',
      transaction_date: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: 'Completed',
      flag_status: 'Suspicious',
      flag_reason: 'International card payment without 3D-secure OTP',
      has_report: true,
      card_details: {
        masked_card: '•••• •••• •••• 4242',
        channel: 'Online'
      }
    },
    {
      id: 3,
      transaction_reference: 'TXN-98212-UPI',
      user_id: 1,
      merchant: 'Fresh Groceries',
      amount: 1250,
      currency: 'INR',
      transaction_type: 'UPI',
      payment_method: 'QR Scan',
      transaction_date: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: 'Completed',
      flag_status: 'Normal',
      has_report: false,
      upi_details: {
        receiver_name: 'Fresh Groceries',
        receiver_upi: 'groceries@ybl'
      }
    }
  ],
  cases: [
    {
      id: 1,
      case_number: 'CASE-2026-000001',
      report_id: 1,
      status: 'Under Review',
      priority: 'High',
      fraud_category: 'UPI Scam',
      amount: 4500,
      upi_id: 'scammer.refund@okaxis',
      merchant: 'Tech Helpdesk',
      description: 'Received a collect request claiming to be refund for electricity bill. Amount was debited immediately.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      assigned_admin_name: 'Platform Administrator',
      user_name: 'Anjan Sharma',
      user_email: 'user@upishield.com',
      user_mobile: '+91 98765 43210',
      transaction_reference: 'TXN-98214-UPI',
      evidence: [
        {
          id: 1,
          file_name: 'debit_sms_screenshot.png',
          file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
          file_type: 'image/png'
        }
      ],
      messages: [
        {
          id: 1,
          sender_type: 'admin',
          sender_name: 'Platform Administrator',
          message: 'Your report has been assigned for administrative review. We are cross-referencing this UPI ID against previous platform records.',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ],
      notes: [
        {
          id: 1,
          admin_name: 'Platform Administrator',
          note: 'UPI ID has 12 previous complaints in this quarter. Recommending verified classification.',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ],
      status_history: [
        {
          id: 1,
          old_status: null,
          new_status: 'Submitted',
          changed_by_name: 'System',
          note: 'Initial user report registered',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 2,
          old_status: 'Submitted',
          new_status: 'Under Review',
          changed_by_name: 'Platform Administrator',
          note: 'High priority queue review initiated',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ]
    }
  ],
  rules: [
    {
      id: 1,
      rule_code: 'HIGH_UPI_AMOUNT',
      name: 'High UPI Amount Threshold',
      description: 'Flags UPI transactions exceeding the configured single-transfer limit.',
      is_enabled: true,
      threshold_value: 50000,
      severity: 'Review',
      updated_by: 'Platform Administrator'
    },
    {
      id: 2,
      rule_code: 'HIGH_CARD_AMOUNT',
      name: 'High Card Transaction Threshold',
      description: 'Flags single credit card transactions exceeding configured monetary limit.',
      is_enabled: true,
      threshold_value: 25000,
      severity: 'Review',
      updated_by: 'Platform Administrator'
    },
    {
      id: 3,
      rule_code: 'NIGHT_TRANSACTION',
      name: 'Late-Night Activity Window',
      description: 'Flags payments initiated during configured nighttime hours (23:00 to 05:00).',
      is_enabled: true,
      threshold_value: 23,
      severity: 'Review',
      updated_by: 'Platform Administrator'
    },
    {
      id: 4,
      rule_code: 'VELOCITY_10MIN',
      name: 'Velocity Threshold (10 Minutes)',
      description: 'Triggers review if user initiates more than N transactions in a 10-minute window.',
      is_enabled: true,
      threshold_value: 5,
      severity: 'Suspicious',
      updated_by: 'Platform Administrator'
    }
  ],
  notifications: [
    {
      id: 1,
      title: 'Case Under Review',
      message: 'Case CASE-2026-000001 status changed to Under Review by Lead Investigator.',
      type: 'Case Status Changed',
      link: '/dashboard/cases?id=1',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 2,
      title: 'Suspect VPA Threshold Warning',
      message: 'VPA scammer.refund@okaxis has reached 12 reports, surpassing threshold (3).',
      type: 'Reported UPI reaches threshold',
      link: '/admin/reported-upi',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 1,
      admin_email: 'admin@upishield.com',
      action: 'Case Status Change',
      target_type: 'Case',
      target_id: 'CASE-2026-000001',
      ip_address: '103.212.144.18',
      details: { old_status: 'Submitted', new_status: 'Under Review', note: 'Priority queue review initiated' },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 2,
      admin_email: 'admin@upishield.com',
      action: 'Rule Updated',
      target_type: 'Rule',
      target_id: 'HIGH_UPI_AMOUNT',
      ip_address: '103.212.144.18',
      details: { threshold_value: 50000, severity: 'Review' },
      created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    }
  ],
  incomes: [
    { id: 1, amount: 75000, source: 'Tech Corp Bangalore', income_type: 'Salary', date: new Date().toISOString(), description: 'Monthly primary salary' },
    { id: 2, amount: 15000, source: 'Freelance Design', income_type: 'Freelance', date: new Date(Date.now() - 604800000).toISOString(), description: 'Frontend design milestone' }
  ],
  expenses: [
    { id: 1, amount: 450, category: 'Food', merchant: 'Blue Tokai Coffee', payment_method: 'UPI', date: new Date().toISOString(), description: 'Morning espresso and bakery' },
    { id: 2, amount: 3420, category: 'Groceries', merchant: "Nature's Basket", payment_method: 'Card', date: new Date(Date.now() - 86400000).toISOString(), description: 'Pantry restocking' },
    { id: 3, amount: 5800, category: 'Shopping', merchant: 'Uniqlo Indiranagar', payment_method: 'UPI', date: new Date(Date.now() - 172800000).toISOString(), description: 'Autumn clothing' },
    { id: 4, amount: 2500, category: 'Bills', merchant: 'BESCOM Electricity', payment_method: 'UPI', date: new Date(Date.now() - 259200000).toISOString(), description: 'Monthly electricity bill' }
  ],
  cards: [
    { id: 1, card_nickname: 'HDFC Regalia Gold', bank_name: 'HDFC Bank', card_network: 'Visa', masked_number: '**** **** **** 4892', last_four: '4892', expiry_month: 8, expiry_year: 2028 },
    { id: 2, card_nickname: 'ICICI Amazon Pay', bank_name: 'ICICI Bank', card_network: 'RuPay', masked_number: '**** **** **** 1024', last_four: '1024', expiry_month: 11, expiry_year: 2027 }
  ],
  budgets: [
    { id: 1, category: 'Food', limit_amount: 6000.0, spent_amount: 4200.0, percentage: 70.0, status_color: 'amber' },
    { id: 2, category: 'Groceries', limit_amount: 6000.0, spent_amount: 3420.0, percentage: 57.0, status_color: 'green' },
    { id: 3, category: 'Shopping', limit_amount: 10000.0, spent_amount: 5800.0, percentage: 58.0, status_color: 'green' },
    { id: 4, category: 'Bills', limit_amount: 7000.0, spent_amount: 2500.0, percentage: 35.7, status_color: 'green' },
    { id: 5, category: 'Travel', limit_amount: 5000.0, spent_amount: 4800.0, percentage: 96.0, status_color: 'orange' },
    { id: 6, category: 'Entertainment', limit_amount: 2000.0, spent_amount: 2350.0, percentage: 117.5, status_color: 'red' }
  ],
  reports: [
    {
      id: 1,
      report_number: 'REP-2026-000012',
      fraud_category: 'UPI Scam',
      amount: 4500,
      merchant: 'Unknown Tech Support',
      upi_id: 'scammer.refund@okaxis',
      status: 'Under Review',
      case_id: 1,
      case_number: 'CASE-2026-000001',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 2,
      report_number: 'REP-2026-000013',
      fraud_category: 'Card Fraud',
      amount: 12999,
      merchant: 'Overseas Digital Store',
      status: 'Submitted',
      case_id: null,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ],
  quarantinedEntities: [
    {
      id: 'QRN-INIT-1',
      entity_id: 'dev-3',
      entity_label: 'DEV-EMU-X99 (Shared Emulator)',
      entity_type: 'DEVICE',
      reason: 'Multi-Account Emulator Detected with shared syndicate connections',
      linked_vpas: ['scammer.refund@okaxis'],
      quarantined_by: 'admin@upishield.ai',
      quarantined_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'QUARANTINED'
    }
  ],
  blockedVpas: ['scammer.refund@okaxis', 'claim.bonus@okhdfcbank', 'fast.lottery@ybl'],
  blockedDevices: ['DEV-EMU-X99']
}

// 5-Feature Explainable AI (XAI) Formatter
function buildXaiResponse(assessment: any, txn: any, baseline: any) {
  // 1. Risk Contribution Breakdown (7 weighted components)
  const fraudModelPts = Math.min(25, Math.max(1, Math.round((assessment.fraud_probability * 100) * 0.25)))
  const anomalyPts = Math.min(20, Math.max(1, Math.round((assessment.sub_scores?.anomaly_score ?? 10) * 0.20)))
  const behaviourPts = Math.min(20, Math.max(1, Math.round((assessment.sub_scores?.behaviour_risk ?? 10) * 0.20)))
  const devicePts = Math.min(10, Math.max(1, Math.round((assessment.sub_scores?.device_risk ?? 5) * 0.10)))
  const locationPts = Math.min(10, Math.max(1, Math.round((assessment.sub_scores?.location_risk ?? 5) * 0.10)))
  const velocityPts = Math.min(10, Math.max(1, Math.round((assessment.sub_scores?.velocity_score ?? 15) * 0.10)))
  const beneficiaryPts = Math.min(5, Math.max(1, Math.round((assessment.sub_scores?.receiver_risk ?? 5) * 0.05)))

  const components = {
    fraud_model: fraudModelPts,
    anomaly: anomalyPts,
    behaviour: behaviourPts,
    device: devicePts,
    location: locationPts,
    velocity: velocityPts,
    beneficiary: beneficiaryPts
  }

  // 2. Risk factors with dynamic reasons and point impacts
  const risk_factors: { feature: string; reason: string; impact: number }[] = []
  if (Array.isArray(assessment.explainable_ai?.shap_contributions)) {
    assessment.explainable_ai.shap_contributions.forEach((c: any) => {
      risk_factors.push({
        feature: c.category ? c.category.toLowerCase() : 'factor',
        reason: c.description || c.feature_name,
        impact: c.impact_score || c.impact_pct || 10
      })
    })
  }

  if (risk_factors.length === 0 && assessment.overall_risk_score > 30) {
    risk_factors.push({ feature: 'transaction_amount', reason: 'Unusual amount compared to user baseline', impact: 21 })
    risk_factors.push({ feature: 'device', reason: 'Unrecognized hardware fingerprint', impact: 12 })
    risk_factors.push({ feature: 'location', reason: 'Outside frequent home perimeter', impact: 10 })
  }

  // 3. Trust signals / mitigating factors
  const trust_factors: string[] = assessment.explainable_ai?.mitigating_factors?.length > 0
    ? assessment.explainable_ai.mitigating_factors
    : [
        'Device fingerprint verified',
        'No previous beneficiary fraud reports',
        'Normal transaction velocity'
      ]

  return {
    risk_score: assessment.overall_risk_score,
    risk_level: assessment.risk_level,
    sub_level: assessment.sub_level,
    fraud_probability: assessment.fraud_probability,
    anomaly_score: Number(((assessment.sub_scores?.anomaly_score ?? 10) / 100).toFixed(2)),
    adaptive_threshold: assessment.adaptive_threshold,
    components,
    risk_factors,
    trust_factors,
    decision: assessment.decision,
    recommended_action: assessment.recommended_action,
    ai_explanation: assessment.explainable_ai?.summary || 'Evaluated across multi-model AI fraud engine.',
    shap_features: {
      increasing: [
        { feature: 'Transaction Amount', impact_pct: Math.min(45, Math.round((assessment.sub_scores?.transaction_risk ?? 10) * 0.28)) },
        { feature: 'New Device', impact_pct: Math.min(35, Math.round((assessment.sub_scores?.device_risk ?? 5) * 0.22)) },
        { feature: 'Location Change', impact_pct: Math.min(30, Math.round((assessment.sub_scores?.location_risk ?? 5) * 0.18)) },
        { feature: 'New Beneficiary', impact_pct: Math.min(25, Math.round((assessment.sub_scores?.receiver_risk ?? 5) * 0.15)) }
      ],
      reducing: [
        { feature: 'Trusted IP / Attestation', impact_pct: -9 },
        { feature: 'Normal Velocity Baseline', impact_pct: -8 }
      ]
    }
  }
}

// Check if external backend is configured
async function tryProxyBackend(request: NextRequest, slugPath: string) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) return null

  try {
    const targetUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/${slugPath}${request.nextUrl.search}`
    const headers = new Headers(request.headers)
    headers.delete('host')

    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store'
    })

    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' }
    })
  } catch (e) {
    console.warn('[Vercel Gateway] Proxy to external backend failed, falling back to serverless handler:', e)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = slug.join('/')

  // Try proxy first if BACKEND_URL configured
  const proxyRes = await tryProxyBackend(request, path)
  if (proxyRes) return proxyRes

  // Serverless handlers:
  if (path === 'health') {
    return NextResponse.json({
      status: 'healthy',
      platform: 'UPI Shield (Vercel Serverless)',
      engine: 'Deterministic Rule Engine (NO AI)',
      timestamp: new Date().toISOString()
    })
  }

  if (path === 'openapi.json') {
    return NextResponse.json({
      openapi: '3.1.0',
      info: {
        title: 'UPI Shield API',
        version: '1.0.0',
        description: 'Deterministic UPI & Credit Card Fraud Reporting, Expense Tracking and Payment Management Platform'
      },
      servers: [
        { url: '/api/v1', description: 'Production Serverless Gateway' },
        { url: 'http://127.0.0.1:8000/api/v1', description: 'Local FastAPI Gateway' }
      ],
      paths: {
        '/auth/login': { post: { summary: 'User login' } },
        '/auth/admin-login': { post: { summary: 'Admin login' } },
        '/users/me': { get: { summary: 'Current user profile' } },
        '/transactions': { get: { summary: 'List transactions' }, post: { summary: 'Create transaction' } },
        '/upi/pay': { post: { summary: 'Initiate UPI payment intent' } },
        '/upi/validate-vpa': { post: { summary: 'Validate VPA' } },
        '/cards': { get: { summary: 'List cards' } },
        '/cards/detect': { post: { summary: 'Detect velocity anomaly' } },
        '/expenses': { get: { summary: 'List expenses' }, post: { summary: 'Create expense' } },
        '/budgets': { get: { summary: 'List budgets' } },
        '/reports': { get: { summary: 'List fraud reports' }, post: { summary: 'Submit report' } },
        '/cases': { get: { summary: 'List cases' } },
        '/rules': { get: { summary: 'List fraud rules' } },
        '/admin/analytics': { get: { summary: 'Platform analytics' } }
      }
    })
  }

  if (path === 'users/me') {
    return NextResponse.json({
      id: 1,
      name: 'Anjan Sharma',
      email: 'user@upishield.com',
      mobile: '+91 98765 43210',
      role: 'user',
      status: 'active'
    })
  }

  if (path === 'transactions') {
    return NextResponse.json(demoState.transactions)
  }

  if (path === 'admin/dashboard') {
    return NextResponse.json({
      stats: {
        total_users: demoState.users.length,
        total_transactions: demoState.transactions.length,
        upi_transactions: demoState.transactions.filter((t) => t.transaction_type === 'UPI').length,
        card_transactions: demoState.transactions.filter((t) => t.transaction_type === 'Card').length,
        fraud_reports: 38,
        open_cases: demoState.cases.length,
        resolved_cases: 24,
        suspicious_transactions: demoState.transactions.filter((t) => t.flag_status === 'Suspicious').length,
        reported_amount: 384500
      },
      charts: {
        reports_by_month: [
          { month: 'Apr', count: 4 },
          { month: 'May', count: 6 },
          { month: 'Jun', count: 9 },
          { month: 'Jul', count: 12 },
          { month: 'Aug', count: 18 },
          { month: 'Sep', count: 38 }
        ],
        fraud_categories: [
          { name: 'UPI Scam', value: 16 },
          { name: 'Card Fraud', value: 8 },
          { name: 'QR Scam', value: 6 },
          { name: 'Phishing', value: 5 },
          { name: 'Impersonation', value: 3 }
        ],
        upi_vs_card: [
          { name: 'UPI Reports', value: 24 },
          { name: 'Card Reports', value: 10 },
          { name: 'Other', value: 4 }
        ],
        case_status_breakdown: [
          { status: 'Submitted', count: 5 },
          { status: 'Under Review', count: 6 },
          { status: 'Waiting for User', count: 3 },
          { status: 'Resolved', count: 24 }
        ],
        top_reported_upis: [
          { upi_id: 'scammer.refund@okaxis', reports: 12, verified: 9, status: 'Frequently Reported' },
          { upi_id: 'fast.lottery@ybl', reports: 7, verified: 5, status: 'Under Review' },
          { upi_id: 'quickloan.agent@icici', reports: 4, verified: 3, status: 'Under Review' }
        ],
        top_reported_merchants: [
          { merchant: 'Global Digital Mart', reports: 8, verified: 6, status: 'Frequently Reported' },
          { merchant: 'Tech Support Live Ltd', reports: 5, verified: 4, status: 'Under Review' },
          { merchant: 'Instant Cash Rewards', reports: 4, verified: 2, status: 'Normal' }
        ]
      }
    })
  }

  if (path === 'admin/users') {
    return NextResponse.json(demoState.users)
  }

  if (path === 'admin/transactions') {
    return NextResponse.json(demoState.transactions)
  }

  if (path === 'cases' || path === 'admin/cases') {
    return NextResponse.json(demoState.cases)
  }

  if (path.startsWith('cases/') || path.startsWith('admin/cases/')) {
    return NextResponse.json(demoState.cases[0])
  }

  if (path === 'income/summary') {
    return NextResponse.json({
      total_income: 90000.0,
      total_expenses: 17420.0,
      net_balance: 72580.0,
      savings: 72580.0,
      savings_percentage: 80.6
    })
  }

  if (path === 'income') {
    return NextResponse.json(demoState.incomes || [])
  }

  if (path === 'expenses/summary') {
    return NextResponse.json({
      total_expenses: 17420.0,
      monthly_budget: 36000.0,
      remaining_budget: 18580.0,
      today_spend: 450.0,
      avg_daily_expense: 725.8,
      highest_category: 'Shopping',
      category_distribution: {
        Shopping: 5800,
        Food: 4200,
        Groceries: 3420,
        Bills: 2500,
        Other: 1500
      },
      monthly_trend: [
        { month: 'Apr', amount: 14200, height: 55 },
        { month: 'May', amount: 16800, height: 68 },
        { month: 'Jun', amount: 15300, height: 60 },
        { month: 'Jul', amount: 18900, height: 85 },
        { month: 'Aug', amount: 16100, height: 64 },
        { month: 'Sep', amount: 17420, height: 72 }
      ],
      payment_method_distribution: {
        UPI: 11200,
        Card: 4720,
        Cash: 1500
      }
    })
  }

  if (path === 'expenses') {
    return NextResponse.json(demoState.expenses || [])
  }

  if (path === 'cards') {
    return NextResponse.json(demoState.cards || [])
  }

  if (path === 'budgets' || path === 'budgets/status') {
    return NextResponse.json({
      total_budget: 36000.0,
      total_spent: 17420.0,
      overall_percentage: 48.4,
      budgets: demoState.budgets || []
    })
  }

  if (path === 'reports' || path === 'admin/reports') {
    return NextResponse.json(demoState.reports || [])
  }

  if (path === 'rules' || path === 'admin/rules') {
    return NextResponse.json(demoState.rules)
  }

  if (path === 'admin/reported-upi') {
    return NextResponse.json([
      { id: 1, upi_id: 'scammer.refund@okaxis', report_count: 12, verified_count: 9, status: 'Frequently Reported', last_reported_at: new Date().toISOString() },
      { id: 2, upi_id: 'fast.lottery@ybl', report_count: 7, verified_count: 5, status: 'Under Review', last_reported_at: new Date().toISOString() }
    ])
  }

  if (path === 'admin/reported-merchants') {
    return NextResponse.json([
      { id: 1, merchant_name: 'Global Digital Mart', report_count: 8, verified_count: 6, categories: ['Card Fraud', 'Phishing'], status: 'Frequently Reported', last_reported_at: new Date().toISOString() },
      { id: 2, merchant_name: 'Tech Support Live Ltd', report_count: 5, verified_count: 4, categories: ['Fake Support', 'UPI Scam'], status: 'Under Review', last_reported_at: new Date().toISOString() }
    ])
  }

  if (path === 'admin/audit-logs') {
    return NextResponse.json(demoState.auditLogs)
  }

  if (path === 'model/performance') {
    return NextResponse.json(MODEL_PERFORMANCE_METRICS)
  }

  if (path === 'model/drift') {
    return NextResponse.json(MODEL_PERFORMANCE_METRICS.drift_monitor)
  }

  if (path === 'model/versions') {
    return NextResponse.json(MODEL_PERFORMANCE_METRICS.versions)
  }

  if (path === 'network/graph' || path === 'admin/network-graph') {
    return NextResponse.json(FRAUD_NETWORK_GRAPH_DATA)
  }

  if (path.startsWith('risk/user/')) {
    const userId = Number(path.split('/')[2]) || 1
    return NextResponse.json({
      user_id: userId,
      baseline: DEFAULT_USER_BASELINE,
      adaptive_threshold: calculateAdaptiveThreshold(DEFAULT_USER_BASELINE),
      recent_anomalies: [
        { type: 'Off-hours login', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), severity: 'MEDIUM' }
      ]
    })
  }

  if (path.startsWith('risk/device/')) {
    const devId = path.split('/')[2] || 'DEV-A782'
    const isEnrolled = DEFAULT_USER_BASELINE.registered_devices.includes(devId)
    return NextResponse.json({
      device_id: devId,
      enrolled: isEnrolled,
      trust_score: isEnrolled ? 94 : 28,
      risk_level: isEnrolled ? 'LOW' : 'HIGH',
      hardware_binding_active: true
    })
  }

  if (path.startsWith('risk/vpa/')) {
    const vpa = decodeURIComponent(path.split('/')[2] || '')
    const isKnownFlagged = vpa.includes('scammer') || vpa.includes('bonus') || vpa.includes('lottery')
    return NextResponse.json({
      vpa,
      reputation_score: isKnownFlagged ? 8 : 92,
      risk_level: isKnownFlagged ? 'CRITICAL' : 'SAFE',
      community_complaints_count: isKnownFlagged ? 14 : 0,
      bank_psp: 'Axis Bank / NPCI Verified'
    })
  }

    if (path.startsWith('risk/qr/')) {
    const qrId = path.split('/')[2] || 'QR-1001'
    return NextResponse.json({
      qr_id: qrId,
      tampering_detected: false,
      integrity_score: 96,
      merchant_verified: true,
      currency: 'INR'
    })
  }

  if (path === 'fraud/evaluate' || path === 'risk/xai') {
    const searchParams = request.nextUrl.searchParams
    const amount = Number(searchParams.get('amount')) || 18500
    const city = searchParams.get('city') || 'Delhi'
    const device_id = searchParams.get('device_id') || searchParams.get('deviceId') || 'DEV-NEW-88'
    const receiver_vpa = searchParams.get('vpa') || searchParams.get('receiver_vpa') || 'new.merchant@okaxis'
    const receiver_name = searchParams.get('merchant') || 'Merchant'

    const normalized = normalizeCrossUpiPayload({ amount, city, device_id, receiver_vpa, receiver_name })
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE)
    return NextResponse.json(buildXaiResponse(assessment, normalized, DEFAULT_USER_BASELINE))
  }

  if (path === 'transactions' || path === 'admin/transactions') {
    return NextResponse.json(demoState.transactions)
  }

  if (path === 'cases' || path === 'admin/cases') {
    return NextResponse.json(demoState.cases)
  }

  if (path === 'entities/quarantined' || path === 'admin/quarantined') {
    return NextResponse.json(demoState.quarantinedEntities)
  }

  if (path === 'vpa/blocked' || path === 'admin/blocked-vpas') {
    return NextResponse.json(demoState.blockedVpas)
  }

  if (path === 'devices/blocked' || path === 'admin/blocked-devices') {
    return NextResponse.json(demoState.blockedDevices)
  }

  // Safe fallback: never return a bare string or empty object without array or schema safety
  return NextResponse.json([])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = slug.join('/')

  // Try proxy first if BACKEND_URL configured
  const proxyRes = await tryProxyBackend(request, path)
  if (proxyRes) return proxyRes

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // Body is empty or form-data
  }

  if (path === 'auth/login' || path === 'admin/login' || path === 'auth/admin-login') {
    const isAdmin = path.includes('admin') || body.email?.includes('admin')
    const userObj = {
      id: isAdmin ? 99 : 1,
      name: isAdmin ? 'Platform Administrator' : 'Anjan Sharma',
      email: body.email || (isAdmin ? 'admin@upishield.ai' : 'demo@upishield.ai'),
      role: isAdmin ? 'admin' : 'user',
      status: 'active'
    }
    return NextResponse.json({
      access_token: `token-${Date.now()}-${isAdmin ? 'admin' : 'user'}`,
      token_type: 'bearer',
      user: userObj,
      user_id: userObj.id,
      user_name: userObj.name,
      user_email: userObj.email,
      role: userObj.role
    })
  }

  // Explainable AI & Dynamic Risk Evaluation Endpoint
  if (path === 'fraud/evaluate' || path === 'risk/xai') {
    const normalized = normalizeCrossUpiPayload(body)
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE, body.prior_transaction)
    return NextResponse.json(buildXaiResponse(assessment, normalized, DEFAULT_USER_BASELINE))
  }

  // Entity Quarantine & VPA Blacklist (Syndicate Intelligence)
  if (path === 'entities/quarantine') {
    const entity_id = body.entity_id || body.id || 'dev-3'
    const entity_label = body.entity_label || body.label || 'DEV-EMU-X99 (Shared Emulator)'
    const entity_type = body.entity_type || 'DEVICE'
    const reason = body.reason || 'Multi-Account Emulator Detected with shared syndicate connections'
    const linked_vpas: string[] = body.linked_vpas || ['scammer.refund@okaxis']

    const quarantineRecord = {
      id: `QRN-${Date.now()}`,
      entity_id,
      entity_label,
      entity_type,
      reason,
      linked_vpas,
      quarantined_by: body.admin_email || 'admin@upishield.ai',
      quarantined_at: new Date().toISOString(),
      status: 'QUARANTINED'
    }

    demoState.quarantinedEntities.push(quarantineRecord)
    linked_vpas.forEach(v => {
      if (!demoState.blockedVpas.includes(v)) {
        demoState.blockedVpas.push(v)
      }
    })

    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: body.admin_email || 'admin@upishield.ai',
      action: 'Quarantine Entity & Block VPA',
      target_type: 'Entity / VPA',
      target_id: entity_label,
      ip_address: '103.212.144.18',
      details: { entity_id, entity_label, entity_type, reason, linked_vpas },
      created_at: new Date().toISOString()
    })

    demoState.notifications.unshift({
      id: demoState.notifications.length + 1,
      title: 'Entity Quarantined & VPAs Blocked',
      message: `Entity "${entity_label}" and associated VPAs (${linked_vpas.join(', ')}) placed on Global UPI Quarantine.`,
      type: 'Quarantine Action',
      link: '/admin/network-graph',
      is_read: false,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Entity ${entity_label} placed on Global UPI Quarantine.`,
      quarantined_entity: quarantineRecord,
      blocked_vpas: demoState.blockedVpas
    })
  }

  // Spawn Syndicate Investigation Case
  if (path === 'cases/spawn-syndicate') {
    const entity_label = body.entity_label || 'DEV-EMU-X99 (Shared Emulator)'
    const caseNum = `CASE-SYN-2026-${Math.floor(100000 + Math.random() * 900000)}`
    const relationships = body.connected_relationships || [
      { name: 'Rohan Mehta (User)', risk: 92, label: 'Shared Emulator Link' },
      { name: 'scammer.refund@okaxis', risk: 95, label: 'Cross-Account Rapid Collect' }
    ]
    const relationshipsDesc = relationships.map((r: any) => `${r.name || r.label} (Risk ${r.risk || 90})`).join(', ')

    const newCase = {
      id: demoState.cases.length + 1,
      case_number: caseNum,
      report_id: Date.now(),
      status: 'Under Review',
      priority: 'Critical',
      fraud_category: 'Syndicate / Emulator Ring',
      amount: 85000,
      upi_id: 'scammer.refund@okaxis',
      merchant: entity_label,
      description: body.reason || `Cross-account emulator network detected. Hardware fingerprint matches Nox/BlueStacks virtualized instance. Used across 3 disparate UPI handles within 48 hours to execute rapid collect requests. Connected relationships: ${relationshipsDesc}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_admin_name: 'Lead Cyber Investigator',
      user_name: 'Rohan Mehta & 2 Linked Accounts',
      user_email: 'syndicate.investigation@upishield.ai',
      user_mobile: '+91 98000 00000',
      transaction_reference: 'TXN-SYN-RING-01',
      evidence: [
        {
          id: Date.now(),
          file_name: 'emulator_fingerprint_dump.json',
          file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
          file_type: 'application/json'
        }
      ],
      messages: [
        {
          id: 1,
          sender_type: 'system',
          sender_name: 'Graph Neural Engine v2.1',
          message: `Syndicate investigation case spawned automatically from topological relationship graph for ${entity_label}.`,
          created_at: new Date().toISOString()
        }
      ],
      notes: [
        {
          id: 1,
          admin_name: 'System',
          note: `High clustering coefficient detected around ${entity_label}. Flagged for multi-bank NPCI coordination.`,
          created_at: new Date().toISOString()
        }
      ],
      status_history: [
        {
          id: Date.now(),
          old_status: null,
          new_status: 'Under Review',
          changed_by_name: 'Platform Administrator',
          note: 'Syndicate investigation case initiated from Network Graph',
          created_at: new Date().toISOString()
        }
      ]
    }

    demoState.cases.unshift(newCase)

    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: 'admin@upishield.ai',
      action: 'Syndicate Case Spawned',
      target_type: 'Case',
      target_id: caseNum,
      ip_address: '103.212.144.18',
      details: { case_number: caseNum, entity_label, priority: 'Critical' },
      created_at: new Date().toISOString()
    })

    demoState.notifications.unshift({
      id: demoState.notifications.length + 1,
      title: 'Syndicate Case Spawned',
      message: `Investigation Case ${caseNum} created for ${entity_label}.`,
      type: 'Case Created',
      link: '/admin/cases',
      is_read: false,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Investigation Case ${caseNum} created for ${entity_label}.`,
      case_number: caseNum,
      case_id: newCase.id,
      case: newCase
    })
  }

  // Record and Persist Transactions
  if (path === 'transactions') {
    const normalized = normalizeCrossUpiPayload(body)
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE, body.prior_transaction)
    const isSuspicious = assessment.risk_level === 'HIGH' || assessment.risk_level === 'CRITICAL'
    const newTxn = {
      id: demoState.transactions.length + 1,
      transaction_reference: `TXN-${Math.floor(10000 + Math.random() * 90000)}-UPI`,
      user_id: 1,
      merchant: body.merchant || body.receiver_name || 'UPI Transfer',
      amount: Number(body.amount) || 0,
      currency: 'INR',
      transaction_type: 'UPI',
      payment_method: body.payment_method || 'UPI App Intent',
      transaction_date: new Date().toISOString(),
      status: assessment.decision === 'BLOCK' ? 'Blocked' : 'Completed',
      flag_status: isSuspicious ? 'Suspicious' : 'Normal',
      flag_reason: assessment.explainable_ai?.summary || '',
      has_report: false,
      upi_details: {
        receiver_name: body.merchant || body.receiver_name || 'Receiver',
        receiver_upi: body.receiver_upi || 'receiver@upi'
      },
      risk_score: assessment.overall_risk_score,
      decision: assessment.decision
    }
    demoState.transactions.unshift(newTxn)

    return NextResponse.json({
      success: true,
      transaction: newTxn,
      assessment: buildXaiResponse(assessment, normalized, DEFAULT_USER_BASELINE)
    })
  }

  // Block VPA Endpoint
  if (path === 'vpa/block') {
    const vpa = body.vpa || body.upi_id
    if (vpa && !demoState.blockedVpas.includes(vpa)) {
      demoState.blockedVpas.push(vpa)
    }
    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: body.admin_email || 'admin@upishield.ai',
      action: 'VPA Blocked',
      target_type: 'VPA',
      target_id: vpa || 'N/A',
      ip_address: '103.212.144.18',
      details: { vpa, reason: body.reason || 'Flagged for suspicious activity' },
      created_at: new Date().toISOString()
    })
    return NextResponse.json({ success: true, message: `VPA ${vpa} added to global blacklist.`, blocked_vpas: demoState.blockedVpas })
  }

  // Block Device Endpoint
  if (path === 'devices/block') {
    const devId = body.device_id || body.deviceId
    if (devId && !demoState.blockedDevices.includes(devId)) {
      demoState.blockedDevices.push(devId)
    }
    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: body.admin_email || 'admin@upishield.ai',
      action: 'Device Quarantined',
      target_type: 'Device',
      target_id: devId || 'N/A',
      ip_address: '103.212.144.18',
      details: { devId, reason: body.reason || 'Flagged as emulator or compromised' },
      created_at: new Date().toISOString()
    })
    return NextResponse.json({ success: true, message: `Device ${devId} quarantined.`, blocked_devices: demoState.blockedDevices })
  }

  // 1. Multi-Model AI Fraud Prediction Endpoint
  if (path === 'fraud/predict') {
    const normalized = normalizeCrossUpiPayload(body)
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE, body.prior_transaction)
    return NextResponse.json({
      success: true,
      transaction_id: normalized.id,
      source_app: normalized.source_app,
      ...assessment
    })
  }

  // 2. Dynamic Risk Scoring Calculation
  if (path === 'risk/calculate') {
    const normalized = normalizeCrossUpiPayload(body)
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE, body.prior_transaction)
    return NextResponse.json({
      overall_risk_score: assessment.overall_risk_score,
      fraud_probability: assessment.fraud_probability,
      decision: assessment.decision,
      risk_level: assessment.risk_level,
      adaptive_threshold: assessment.adaptive_threshold,
      sub_scores: assessment.sub_scores,
      behaviour_metrics: assessment.behaviour_metrics,
      explainable_ai: assessment.explainable_ai
    })
  }

  // 3. Unsupervised Isolation Forest Anomaly Detection
  if (path === 'anomaly/detect') {
    const normalized = normalizeCrossUpiPayload(body)
    const assessment = evaluateDynamicRisk(normalized, DEFAULT_USER_BASELINE, body.prior_transaction)
    const isAnomaly = assessment.sub_scores.anomaly_score >= 45 || assessment.behaviour_metrics.impossible_travel_detected

    return NextResponse.json({
      anomaly_detected: isAnomaly,
      anomaly_score: assessment.sub_scores.anomaly_score,
      risk_level: assessment.risk_level,
      primary_driver: assessment.explainable_ai.primary_risk_driver,
      velocity_kmh: assessment.behaviour_metrics.velocity_kmh || 0,
      impossible_travel: assessment.behaviour_metrics.impossible_travel_detected,
      deviation_percentage: assessment.behaviour_metrics.deviation_percentage,
      recommendation: isAnomaly ? 'STEP_UP_AUTHENTICATION_REQUIRED' : 'NORMAL_PATTERNS_DETECTED'
    })
  }

  // 4. User and Admin Feedback Loop Collection
  if (path === 'feedback') {
    const isFalsePositive = Boolean(body.false_positive || body.user_feedback === 'genuine_was_me')
    const isFraudConfirmed = Boolean(body.user_feedback === 'fraud_not_me' || body.admin_label === 'FRAUD')

    if (isFalsePositive) {
      DEFAULT_USER_BASELINE.false_positive_count += 1
    }
    if (isFraudConfirmed) {
      DEFAULT_USER_BASELINE.recent_fraud_count += 1
    }

    const feedbackEntry = {
      id: `FB-${Date.now()}`,
      transaction_id: body.transaction_id || 'TXN-RECENT',
      user_feedback: body.user_feedback || 'acknowledged',
      admin_label: body.admin_label || 'VERIFIED',
      false_positive: isFalsePositive,
      recorded_at: new Date().toISOString(),
      updated_adaptive_threshold: calculateAdaptiveThreshold(DEFAULT_USER_BASELINE)
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback securely ingested into active model retraining queue',
      feedback: feedbackEntry
    })
  }

  // 5. Automated AI Model Retraining Trigger
  if (path === 'model/retrain') {
    MODEL_PERFORMANCE_METRICS.last_retrained = new Date().toISOString()
    MODEL_PERFORMANCE_METRICS.dataset_samples += 28400
    const newVersion = `v2.4.${MODEL_PERFORMANCE_METRICS.versions.length + 1}`

    const newVersionEntry = {
      version: newVersion,
      deployed_at: new Date().toISOString(),
      accuracy: 99.52,
      f1_score: 98.48,
      roc_auc: 0.993,
      status: 'ACTIVE',
      changelog: `Self-learning feedback loop iteration. Retrained on ${MODEL_PERFORMANCE_METRICS.dataset_samples.toLocaleString()} verified samples.`
    }

    MODEL_PERFORMANCE_METRICS.versions.unshift(newVersionEntry)
    MODEL_PERFORMANCE_METRICS.active_version = `${newVersion}-production`
    MODEL_PERFORMANCE_METRICS.drift_monitor.data_drift_psi = 0.024
    MODEL_PERFORMANCE_METRICS.drift_monitor.retraining_recommended = false

    return NextResponse.json({
      success: true,
      status: 'RETRAINING_COMPLETED',
      active_version: newVersion,
      metrics: {
        accuracy: 99.52,
        precision: 98.92,
        recall: 98.05,
        f1_score: 98.48,
        roc_auc: 0.993
      },
      samples_processed: MODEL_PERFORMANCE_METRICS.dataset_samples,
      drift_reduced_psi: 0.024,
      completed_at: new Date().toISOString()
    })
  }

  if (path === 'auth/register') {
    const userObj = {
      id: Date.now(),
      name: body.name || 'New User',
      email: body.email || 'user@upishield.ai',
      mobile: body.mobile || '+91 98765 43210',
      role: 'user',
      status: 'active'
    }
    return NextResponse.json({
      access_token: `token-${Date.now()}-user`,
      token_type: 'bearer',
      user: userObj,
      user_id: userObj.id,
      user_name: userObj.name,
      user_email: userObj.email,
      role: userObj.role
    })
  }

  if (path === 'reports') {
    const caseNum = `CASE-2026-${Math.floor(100000 + Math.random() * 900000)}`
    const newCase = {
      id: demoState.cases.length + 1,
      case_number: caseNum,
      report_id: Date.now(),
      status: 'Submitted',
      priority: 'High',
      fraud_category: body.fraud_category || 'UPI Scam',
      amount: body.amount || 0,
      upi_id: body.upi_id,
      merchant: body.merchant,
      description: body.description,
      user_name: 'Anjan Sharma',
      user_email: 'user@upishield.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      evidence: [],
      messages: [],
      notes: [],
      status_history: [
        {
          id: Date.now(),
          old_status: null,
          new_status: 'Submitted',
          changed_by_name: 'System',
          note: 'Case registered',
          created_at: new Date().toISOString()
        }
      ]
    }
    demoState.cases.unshift(newCase)
    return NextResponse.json({
      id: Date.now(),
      case_id: newCase.id,
      case_number: caseNum,
      status: 'Submitted'
    })
  }

  if (path.includes('messages')) {
    return NextResponse.json({
      id: Date.now(),
      message: body.message,
      created_at: new Date().toISOString()
    })
  }

  if (path.includes('note')) {
    return NextResponse.json({
      id: Date.now(),
      note: body.note,
      created_at: new Date().toISOString()
    })
  }

  return NextResponse.json({ success: true, message: 'Recorded successfully', id: Date.now() })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = slug.join('/')

  const proxyRes = await tryProxyBackend(request, path)
  if (proxyRes) return proxyRes

  let body: any = {}
  try {
    body = await request.json()
  } catch {}

  // Update Fraud Rule
  if (path === 'rules' || path.startsWith('rules/') || path === 'admin/rules') {
    const ruleId = Number(body.rule_id || body.id || path.split('/')[1])
    const ruleIndex = demoState.rules.findIndex(r => r.id === ruleId || r.rule_code === body.rule_code)

    if (ruleIndex >= 0) {
      if (body.threshold_value !== undefined) demoState.rules[ruleIndex].threshold_value = body.threshold_value
      if (body.severity !== undefined) demoState.rules[ruleIndex].severity = body.severity
      if (body.is_enabled !== undefined) demoState.rules[ruleIndex].is_enabled = body.is_enabled
      demoState.rules[ruleIndex].updated_by = body.author || 'Platform Administrator'

      demoState.auditLogs.unshift({
        id: demoState.auditLogs.length + 1,
        admin_email: body.author || 'admin@upishield.ai',
        action: 'Rule Parameters Updated',
        target_type: 'Rule',
        target_id: demoState.rules[ruleIndex].rule_code,
        ip_address: '103.212.144.18',
        details: { threshold_value: body.threshold_value, severity: body.severity, is_enabled: body.is_enabled, reason: body.reason },
        created_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: `Rule ${demoState.rules[ruleIndex].name} updated successfully.`,
        rule: demoState.rules[ruleIndex]
      })
    }
  }

  // Update Case
  if (path === 'cases' || path.startsWith('cases/') || path === 'admin/cases') {
    const caseId = Number(body.case_id || body.id || path.split('/')[1])
    const caseIndex = demoState.cases.findIndex(c => c.id === caseId || c.case_number === body.case_number)

    if (caseIndex >= 0) {
      const oldStatus = demoState.cases[caseIndex].status
      if (body.status) demoState.cases[caseIndex].status = body.status
      if (body.priority) demoState.cases[caseIndex].priority = body.priority
      demoState.cases[caseIndex].updated_at = new Date().toISOString()

      demoState.cases[caseIndex].status_history.unshift({
        id: Date.now(),
        old_status: oldStatus,
        new_status: body.status || oldStatus,
        changed_by_name: body.admin_name || 'Platform Administrator',
        note: body.note || 'Status updated via administrative console',
        created_at: new Date().toISOString()
      })

      demoState.auditLogs.unshift({
        id: demoState.auditLogs.length + 1,
        admin_email: body.admin_email || 'admin@upishield.ai',
        action: 'Case Status Change',
        target_type: 'Case',
        target_id: demoState.cases[caseIndex].case_number,
        ip_address: '103.212.144.18',
        details: { old_status: oldStatus, new_status: body.status, note: body.note },
        created_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: `Case ${demoState.cases[caseIndex].case_number} updated to ${body.status}.`,
        case: demoState.cases[caseIndex]
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Updated successfully',
    updated_at: new Date().toISOString(),
    ...body
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = slug.join('/')

  const proxyRes = await tryProxyBackend(request, path)
  if (proxyRes) return proxyRes

  return NextResponse.json({ success: true, message: 'Removed successfully' })
}
