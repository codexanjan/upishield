import { NextRequest, NextResponse } from 'next/server'
import {
  evaluateDynamicRisk,
  normalizeCrossUpiPayload,
  MODEL_PERFORMANCE_METRICS,
  FRAUD_NETWORK_GRAPH_DATA,
  DEFAULT_USER_BASELINE,
  calculateAdaptiveThreshold,
  calculateUpiGuardMasterRisk,
  INITIAL_FEEDBACK_RECORDS,
  INITIAL_FRAUD_PATTERNS,
  INITIAL_UPI_PROVIDERS,
  INITIAL_SYSTEM_METRICS,
  executeModelRetraining,
  recalculateDynamicAdaptiveThreshold,
  scanForEvolvingPatterns,
  FeedbackRecord,
  ModelTrainingState,
  FraudPattern,
  UpiProviderSource,
  SystemMetrics
} from '@/lib/ai-fraud-engine'
import { INITIAL_DEMO_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_ALERTS } from '@/lib/upiguard-store'

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
      admin_email: 'ai-engine@upishield.ai',
      action: 'AI Model Retrained',
      target_type: 'Model_Ensemble',
      target_id: 'v2.4.1-feedback-retrained',
      ip_address: '10.0.4.12',
      details: {
        trigger: 'Batch Retraining Pipeline',
        samples_learned: 48,
        prior_accuracy: 99.1,
        new_accuracy: 99.4,
        f1_score: 98.3,
        pipeline: 'Supervised XGBoost + Isolation Forest recalibration'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    {
      id: 2,
      admin_email: 'ai-engine@upishield.ai',
      action: 'Model Version Changed',
      target_type: 'Model_Registry',
      target_id: 'v2.4.1',
      ip_address: '10.0.4.12',
      details: {
        previous_version: 'v2.4.0',
        active_version: 'v2.4.1',
        deployment_mode: 'Zero-Downtime Hot Swap',
        traffic_allocation_pct: 100
      },
      created_at: new Date(Date.now() - 1000 * 60 * 24).toISOString()
    },
    {
      id: 3,
      admin_email: 'admin@upishield.ai',
      action: 'Threshold Changed',
      target_type: 'Adaptive_Threshold',
      target_id: 'USER_1_ANJAN',
      ip_address: '103.212.144.18',
      details: {
        previous_threshold: 70.0,
        new_threshold: 72.5,
        delta: 2.5,
        reason: 'False positive confirmed: Verified legitimate appliance purchase TXN-7419 (+2.5 relaxation)'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 4,
      admin_email: 'gateway@upishield.ai',
      action: 'Fraud Confirmed',
      target_type: 'Feedback_Ground_Truth',
      target_id: 'TXN-98214-UPI',
      ip_address: '103.212.144.18',
      details: {
        amount: 4500,
        receiver_vpa: 'scammer.refund@okaxis',
        reported_by: 'USER_APP',
        classification: 'CONFIRMED_FRAUD',
        dispute_reason: 'Unauthorized collect request impersonating electricity refund'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    },
    {
      id: 5,
      admin_email: 'gateway@upishield.ai',
      action: 'Legitimate Transaction Confirmed',
      target_type: 'Feedback_Ground_Truth',
      target_id: 'TXN-74190-UPI',
      ip_address: '103.212.144.18',
      details: {
        amount: 850,
        receiver_vpa: 'nature.basket@icici',
        reported_by: 'USER_APP',
        classification: 'CONFIRMED_LEGITIMATE',
        notes: 'User verified via face recognition & biometric check'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString()
    },
    {
      id: 6,
      admin_email: 'admin@upishield.ai',
      action: 'Fraud Rule Changed',
      target_type: 'Fraud_Rule',
      target_id: 'RULE_BURST_COLLECT',
      ip_address: '103.212.144.18',
      details: {
        pattern_id: 'PAT-01',
        pattern_name: 'High-Velocity Phishing Burst',
        status: 'ACTIVATED',
        action_enforced: 'BLOCK_IF_VELOCITY_EXCEEDED'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString()
    },
    {
      id: 7,
      admin_email: 'admin@upishield.ai',
      action: 'UPI Source Added/Updated',
      target_type: 'UPI_Integration',
      target_id: 'APP_C_NEOBANK',
      ip_address: '103.212.144.18',
      details: {
        provider_name: 'UPI App C (Neobank QR Network)',
        status: 'ACTIVE',
        integration_type: 'DEMO_SIMULATED',
        endpoint: '/api/v1/upi/ingest'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    },
    {
      id: 8,
      admin_email: 'ai-engine@upishield.ai',
      action: 'Prediction Generated',
      target_type: 'Inference_Gateway',
      target_id: 'TXN-UPI-884210',
      ip_address: '10.0.4.18',
      details: {
        source_app: 'UPI App B',
        amount: 49500,
        risk_score: 94,
        decision: 'BLOCK',
        primary_driver: 'Impossible travel velocity (1,150 km/h) & Blacklisted VPA'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString()
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
  blockedDevices: ['DEV-EMU-X99'],
  feedbackRecords: [...INITIAL_FEEDBACK_RECORDS],
  modelTrainingState: {
    active_version: 'v2.4.1',
    last_retrained: '2026-09-24T18:30:00Z',
    dataset_samples: 1420500,
    confirmed_fraud_samples: 24820,
    confirmed_legit_samples: 1395680,
    newly_learned_samples: 1,
    training_status: 'IDLE' as ModelTrainingState['training_status'],
    metrics: {
      accuracy: 99.4,
      precision: 98.8,
      recall: 97.9,
      f1_score: 98.3,
      roc_auc: 0.992,
      false_positive_rate: 0.012
    },
    versions: [...MODEL_PERFORMANCE_METRICS.versions] as ModelTrainingState['versions']
  } as ModelTrainingState,
  fraudPatterns: [...INITIAL_FRAUD_PATTERNS],
  upiProviders: [...INITIAL_UPI_PROVIDERS],
  systemMetrics: { ...INITIAL_SYSTEM_METRICS },
  adaptiveThresholdHistory: [
    {
      currentThreshold: 75.0,
      previousThreshold: 72.5,
      thresholdDelta: 2.5,
      reason: 'Relaxed by 2.5 pts due to verified false positive reports',
      timestamp: '2026-09-28T14:15:00Z'
    },
    {
      currentThreshold: 72.5,
      previousThreshold: 76.5,
      thresholdDelta: -4.0,
      reason: 'Tightened by 4.0 pts due to 1 confirmed fraud incident',
      timestamp: '2026-09-27T09:30:00Z'
    }
  ]
}

function detectExpenseCategory(merchant: string = '', note: string = ''): string {
  const text = `${merchant} ${note}`.toLowerCase()
  if (text.includes('cafe') || text.includes('coffee') || text.includes('food') || text.includes('restaurant') || text.includes('swiggy') || text.includes('zomato') || text.includes('tokai') || text.includes('lunch') || text.includes('dinner')) return 'Food'
  if (text.includes('grocer') || text.includes('basket') || text.includes('supermarket') || text.includes('mart') || text.includes('kirana')) return 'Groceries'
  if (text.includes('uber') || text.includes('ola') || text.includes('metro') || text.includes('fuel') || text.includes('petrol') || text.includes('travel') || text.includes('flight') || text.includes('auto')) return 'Transport'
  if (text.includes('bescom') || text.includes('act') || text.includes('bill') || text.includes('electric') || text.includes('water') || text.includes('recharge') || text.includes('airtel') || text.includes('jio') || text.includes('power')) return 'Bills'
  if (text.includes('uniqlo') || text.includes('zara') || text.includes('shopping') || text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('store') || text.includes('cloth')) return 'Shopping'
  if (text.includes('hospital') || text.includes('clinic') || text.includes('pharmacy') || text.includes('apollo') || text.includes('med') || text.includes('health')) return 'Healthcare'
  if (text.includes('netflix') || text.includes('spotify') || text.includes('prime') || text.includes('hotstar') || text.includes('sub') || text.includes('movie')) return 'Subscriptions'
  return 'Other'
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

  // UPIGuard AI Health Check (Section 111)
  if (path === 'health' || path === 'system/health') {
    return NextResponse.json({
      api: 'ok',
      database: 'ok',
      ml: 'ok',
      realtime: 'ok',
      demoMode: true,
      platform: 'UPIGuard AI Demo Network — Closed-Loop UPI Simulation',
      status: 'ONLINE',
      system: {
        api: 'ONLINE',
        database: 'ONLINE',
        mlService: 'ONLINE',
        realtime: 'ONLINE',
        demoMode: 'ACTIVE'
      },
      timestamp: new Date().toISOString()
    })
  }

  // Demo Accounts & Balances (Section 6 & 7)
  if (path === 'accounts' || path === 'demo/accounts') {
    return NextResponse.json({
      success: true,
      accounts: INITIAL_DEMO_ACCOUNTS
    })
  }

  // Simulated Payments List & Details (Section 74)
  if (path === 'payments' || path === 'payments/list') {
    return NextResponse.json({
      success: true,
      transactions: INITIAL_TRANSACTIONS
    })
  }

  if (path.startsWith('payments/') && !path.includes('/')) {
    const paymentId = path.replace('payments/', '')
    const txn = INITIAL_TRANSACTIONS.find(t => t.transactionId === paymentId || t.id === paymentId)
    if (txn) {
      return NextResponse.json({ success: true, payment: txn })
    }
    return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 })
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
    const total_income = (demoState.incomes || []).reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0) || 90000.0
    const total_expenses = (demoState.expenses || []).reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
    const net_balance = Math.max(0, total_income - total_expenses)
    const savings = net_balance
    const savings_percentage = total_income > 0 ? Number(((savings / total_income) * 100).toFixed(1)) : 0
    return NextResponse.json({
      total_income,
      total_expenses,
      net_balance,
      savings,
      savings_percentage
    })
  }

  if (path === 'income') {
    return NextResponse.json(demoState.incomes || [])
  }

  if (path === 'expenses/summary') {
    const expensesList = demoState.expenses || []
    const total_expenses = expensesList.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
    const monthly_budget = 35000.0
    const remaining_budget = Math.max(0, monthly_budget - total_expenses)

    const todayStr = new Date().toISOString().split('T')[0]
    const today_spend = expensesList
      .filter((e: any) => (e.date || '').startsWith(todayStr))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)

    const category_distribution: Record<string, number> = {}
    const payment_method_distribution: Record<string, number> = {}

    expensesList.forEach((e: any) => {
      const cat = e.category || 'Other'
      const amt = Number(e.amount) || 0
      category_distribution[cat] = (category_distribution[cat] || 0) + amt

      const method = e.payment_method || 'UPI'
      payment_method_distribution[method] = (payment_method_distribution[method] || 0) + amt
    })

    let highest_category = 'Other'
    let maxCatAmt = -1
    Object.entries(category_distribution).forEach(([cat, val]) => {
      if (val > maxCatAmt) {
        maxCatAmt = val
        highest_category = cat
      }
    })

    return NextResponse.json({
      total_expenses,
      monthly_budget,
      remaining_budget,
      today_spend: today_spend || 850.0,
      avg_daily_expense: Number((total_expenses / 30).toFixed(1)),
      highest_category,
      category_distribution,
      monthly_trend: [
        { month: 'Apr', amount: 14200, height: 55 },
        { month: 'May', amount: 16800, height: 68 },
        { month: 'Jun', amount: 15300, height: 60 },
        { month: 'Jul', amount: 18900, height: 85 },
        { month: 'Aug', amount: 16100, height: 64 },
        { month: 'Sep', amount: Math.max(17420, total_expenses), height: 75 }
      ],
      payment_method_distribution
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

  // Objective 3: Model Learning & Feedback Statistics
  if (path === 'model/feedback' || path === 'model/feedback/stats') {
    const unlearned = demoState.feedbackRecords.filter((f: any) => !f.isIncorporatedIntoDataset)
    const confirmedFraud = demoState.feedbackRecords.filter((f: any) => f.actualOutcome === 'FRAUD').length
    const confirmedLegit = demoState.feedbackRecords.filter((f: any) => f.actualOutcome === 'LEGITIMATE').length
    return NextResponse.json({
      total_feedback: demoState.feedbackRecords.length,
      confirmed_fraud: confirmedFraud,
      confirmed_legit: confirmedLegit,
      newly_learned_samples: unlearned.length,
      records: demoState.feedbackRecords
    })
  }

  // Objective 3: Training Dataset Statistics
  if (path === 'model/training-data') {
    return NextResponse.json({
      dataset_samples: demoState.modelTrainingState.dataset_samples,
      confirmed_fraud_samples: demoState.modelTrainingState.confirmed_fraud_samples,
      confirmed_legit_samples: demoState.modelTrainingState.confirmed_legit_samples,
      newly_learned_samples: demoState.modelTrainingState.newly_learned_samples,
      features_monitored: [
        'transaction_amount',
        'transaction_velocity',
        'time_of_day_anomaly',
        'device_fingerprint_change',
        'location_anomaly_distance',
        'receiver_vpa_reputation',
        'qr_tampering_signature',
        'historical_dispute_ratio'
      ],
      last_training_time: demoState.modelTrainingState.last_retrained,
      training_status: demoState.modelTrainingState.training_status
    })
  }

  // Objective 3: Model Status & Version
  if (path === 'model/status' || path === 'model/version') {
    return NextResponse.json({
      active_version: demoState.modelTrainingState.active_version,
      last_retrained: demoState.modelTrainingState.last_retrained,
      training_status: demoState.modelTrainingState.training_status,
      metrics: demoState.modelTrainingState.metrics,
      newly_learned_samples: demoState.modelTrainingState.newly_learned_samples
    })
  }

  // Objective 3: Fraud Patterns
  if (path === 'fraud-patterns' || path === 'admin/fraud-patterns') {
    return NextResponse.json(demoState.fraudPatterns)
  }

  // Objective 3: Multiple UPI Integrations
  if (path === 'upi/integrations' || path === 'admin/upi-integrations') {
    return NextResponse.json(demoState.upiProviders)
  }

  // Objective 3: Scalability & System Monitoring
  if (path === 'system/metrics' || path === 'system/monitoring' || path === 'admin/system-metrics') {
    return NextResponse.json(demoState.systemMetrics)
  }

  // Objective 3: Adaptive Threshold Details & History
  if (path === 'adaptive-threshold' || path === 'admin/adaptive-threshold') {
    const latest = demoState.adaptiveThresholdHistory[0] || {
      currentThreshold: 75.0,
      previousThreshold: 72.5,
      thresholdDelta: 2.5,
      reason: 'Baseline diurnal calibration',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json({
      current_threshold: latest.currentThreshold,
      previous_threshold: latest.previousThreshold,
      threshold_delta: latest.thresholdDelta,
      reason: latest.reason,
      timestamp: latest.timestamp,
      history: demoState.adaptiveThresholdHistory
    })
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
    const isAdmin = path.includes('admin') || (body.email && body.email.includes('admin'))
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (isAdmin) {
      const validAdmin = (email === 'admin@upishield.ai' || email === 'admin@upiguard') && password === 'admin123'
      if (!validAdmin) {
        return NextResponse.json(
          { success: false, error: 'Invalid administrator credentials. Access restricted.' },
          { status: 401 }
        )
      }
      const adminObj = {
        id: 99,
        name: 'Platform Administrator',
        email: email || 'admin@upishield.ai',
        role: 'admin',
        status: 'active'
      }
      return NextResponse.json({
        success: true,
        access_token: `token-${Date.now()}-admin`,
        token_type: 'bearer',
        user: adminObj,
        user_id: adminObj.id,
        user_name: adminObj.name,
        user_email: adminObj.email,
        role: 'admin'
      })
    } else {
      // User login validation
      const isDefaultUser = (email === 'demo@upishield.ai' || email === 'user@upishield.com' || email === 'anjan@upiguard') && password === 'shield123'
      const matchedUser = demoState.users.find((u: any) => u.email.toLowerCase() === email)
      const isRegisteredUser = matchedUser && (matchedUser as any).password === password

      if (!isDefaultUser && !isRegisteredUser) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password. Please verify your credentials.' },
          { status: 401 }
        )
      }

      const userObj = matchedUser || {
        id: 1,
        name: 'Anjan Sharma',
        email: email || 'demo@upishield.ai',
        role: 'user',
        status: 'active'
      }

      return NextResponse.json({
        success: true,
        access_token: `token-${Date.now()}-user`,
        token_type: 'bearer',
        user: userObj,
        user_id: userObj.id,
        user_name: userObj.name,
        user_email: userObj.email,
        role: 'user'
      })
    }
  }

  // User Signup / Registration
  if (path === 'auth/register') {
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const mobile = (body.mobile || '').trim()

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required.' },
        { status: 400 }
      )
    }

    if (demoState.users.some((u: any) => u.email.toLowerCase() === email)) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      )
    }

    const newUser = {
      id: demoState.users.length + 1,
      name,
      email,
      mobile: mobile || '+91 98000 00000',
      password, // In demo serverless state
      role: 'user',
      status: 'active',
      joined: new Date().toISOString(),
      transactions_count: 0,
      reports_count: 0,
      cases_count: 0
    }
    demoState.users.push(newUser)

    return NextResponse.json({
      success: true,
      access_token: `token-${Date.now()}-user`,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: 'user',
        status: 'active'
      },
      user_id: newUser.id,
      user_name: newUser.name,
      user_email: newUser.email,
      role: 'user'
    }, { status: 201 })
  }

  // UPIGuard AI Payment Creation & Live Risk Analysis (Section 74, 75, 76)
  if (path === 'payments' || path === 'payments/create') {
    const amount = Number(body.amount) || 5000
    const senderUpiId = body.senderUpiId || 'anjan@upiguard'
    const receiverUpiId = body.receiverUpiId || 'abc@upiguard'
    const receiverName = body.receiverName || (receiverUpiId.includes('coffee') ? 'UPIGuard Coffee' : 'ABC Electronics')
    const isNewDevice = Boolean(body.isNewDevice || (body.deviceId && body.deviceId.includes('Unknown')))
    const locationCity = body.location?.city || body.city || 'Hubballi'

    const risk = calculateUpiGuardMasterRisk({
      amount,
      senderUpiId,
      receiverUpiId,
      receiverName,
      isNewDevice,
      locationCity,
      deviceTrust: isNewDevice ? 18 : 94,
      velocityCount: body.velocityCount || 1,
      normalCity: 'Hubballi'
    })

    const transactionId = body.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`

    return NextResponse.json({
      success: true,
      transactionId,
      riskScore: risk.finalRisk,
      riskLevel: risk.riskLevel,
      decision: risk.decision === 'BLOCK' ? 'BLOCK' : risk.decision === 'HOLD' ? 'STEP_UP_AUTH' : risk.decision === 'VERIFY' ? 'ENHANCED_AUTH' : 'ALLOW_WITH_AUTH',
      components: risk.components,
      fraudProbability: risk.fraudProbability,
      explanations: risk.explanations,
      shapContributions: risk.shapContributions,
      requiresOtp: true, // OTP_REQUIRED_FOR_ALL_DEMO_PAYMENTS=true
      payment: {
        transactionId,
        senderUpiId,
        receiverUpiId,
        receiverName,
        amount,
        currency: 'INR',
        note: body.note || 'Demo Payment',
        status: risk.decision === 'BLOCK' ? 'BLOCKED' : 'PENDING'
      }
    })
  }

  // Payment Risk Analysis Endpoint (Section 74)
  if (path.endsWith('/analyze') || path === 'payments/analyze' || path === 'risk/analyze') {
    const amount = Number(body.amount) || 5000
    const senderUpiId = body.senderUpiId || 'anjan@upiguard'
    const receiverUpiId = body.receiverUpiId || 'abc@upiguard'
    const isNewDevice = Boolean(body.isNewDevice)
    const locationCity = body.location?.city || body.city || 'Hubballi'

    const risk = calculateUpiGuardMasterRisk({
      amount,
      senderUpiId,
      receiverUpiId,
      isNewDevice,
      locationCity
    })

    return NextResponse.json({
      success: true,
      riskScore: risk.finalRisk,
      riskLevel: risk.riskLevel,
      decision: risk.decision,
      components: risk.components,
      fraudProbability: risk.fraudProbability,
      explanations: risk.explanations,
      shapContributions: risk.shapContributions
    })
  }

  // QR Parser Endpoint with Real-Time Risk & Fraud Interception (Prompt Spec 36)
  if (path === 'upi/parse-qr' || path.endsWith('/parse-qr')) {
    const rawQr = (body.qr_data || body.qrData || '').trim()
    if (!rawQr.startsWith('upi://pay')) {
      return NextResponse.json({
        is_upi: false,
        raw_data: rawQr,
        warning_message: 'Scanned QR code does not contain a standard NPCI UPI URI (upi://pay).'
      })
    }

    try {
      const urlParams = new URLSearchParams(rawQr.replace(/^upi:\/\/pay\??/, ''))
      const receiver_upi = urlParams.get('pa') || 'merchant@upi'
      const receiver_name = urlParams.get('pn') || 'Merchant'
      const amountStr = urlParams.get('am')
      const amount = amountStr ? parseFloat(amountStr) : null
      const note = urlParams.get('tn') || 'Payment'
      const mc = urlParams.get('mc') || ''

      const isKnownScam =
        receiver_upi.includes('fake') ||
        receiver_upi.includes('scam') ||
        receiver_upi.includes('hack') ||
        receiver_upi.includes('quickcash') ||
        receiver_upi.includes('lottery') ||
        (note.toLowerCase().includes('refund') && !!amount && amount > 1000)

      // Evaluate risk through the AI engine
      const risk = evaluateDynamicRisk({
        amount: amount || 500,
        senderUpiId: 'demo@upishield.ai',
        receiverUpiId: receiver_upi,
        isNewDevice: isKnownScam,
        locationCity: 'Bengaluru'
      })

      const riskScore = isKnownScam ? 98 : risk.finalRisk
      const riskLevel = isKnownScam ? 'CRITICAL' : risk.riskLevel
      const decision = isKnownScam ? 'BLOCKED' : risk.decision

      return NextResponse.json({
        is_upi: true,
        receiver_upi,
        receiver_name,
        amount,
        note,
        mc,
        raw_data: rawQr,
        is_reported: isKnownScam,
        warning_message: isKnownScam
          ? 'FRAUD DETECTED: This QR initiates a disguised collect-request and is flagged by NPCI cyber intelligence.'
          : null,
        risk_score: riskScore,
        risk_level: riskLevel,
        decision,
        fraud_reasons: isKnownScam
          ? [
              'Disguised Collect-Request: promises refund/cashback but executes an outbound debit of funds.',
              'Unregistered PSP Handle: @fakeicici is not an NPCI-approved bank gateway.',
              'Flagged in National Fraud Registry: multiple active user complaints.'
            ]
          : []
      })
    } catch (err: any) {
      return NextResponse.json({
        is_upi: false,
        raw_data: rawQr,
        warning_message: `Failed to decode UPI QR: ${err.message}`
      })
    }
  }

  // QR Generator Endpoint
  if (path === 'upi/generate-qr' || path.endsWith('/generate-qr')) {
    const upi_id = body.upi_id || body.upiId || 'starbucks.india@icici'
    const name = body.name || 'Starbucks India'
    const amount = body.amount ? Number(body.amount) : 290
    const note = body.note || 'Payment'
    const mc = body.mc || '5812'
    const upi_uri = `upi://pay?pa=${encodeURIComponent(upi_id)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}&mc=${mc}`

    return NextResponse.json({
      success: true,
      upi_uri,
      receiver_upi: upi_id,
      receiver_name: name,
      amount,
      note,
      mc
    })
  }

  // Demo UPI PIN Verification (Section 28)
  if (path === 'auth/pin/verify' || path.endsWith('/pin')) {
    const pin = body.pin?.trim()
    const senderUpiId = body.senderUpiId || body.userId || 'anjan@upiguard'
    const expectedPins: Record<string, string> = {
      'anjan@upiguard': '2580',
      'rahul@upiguard': '4821',
      'priya@upiguard': '7314',
      'abc@upiguard': '1234',
      'coffee@upiguard': '1122'
    }
    const expected = expectedPins[senderUpiId] || '2580'
    const verified = pin === expected

    if (verified) {
      return NextResponse.json({
        verified: true,
        method: 'UPI_PIN',
        message: 'UPI PIN verified successfully'
      })
    }
    return NextResponse.json({
      verified: false,
      method: 'UPI_PIN',
      message: `Invalid UPI PIN. Demo PIN for ${senderUpiId} is ${expected}`
    }, { status: 400 })
  }

  // Demo Face Biometric Verification (Section 29, 31)
  if (path === 'auth/face/verify' || path.endsWith('/face')) {
    const matchScore = Number(body.matchScore) || 0.84
    const threshold = 0.60
    const verified = matchScore >= threshold

    return NextResponse.json({
      verified,
      method: 'FACE_SCAN',
      matchScore,
      threshold,
      message: verified ? 'Identity verified via facial biometrics' : 'Face match score below threshold'
    })
  }

  // Mandatory Random 6-digit OTP Request (Section 33, 34, 35, 36)
  if (path === 'auth/otp/request' || path.endsWith('/otp/request')) {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const challengeId = `OTP-${Math.floor(10000 + Math.random() * 90000)}`
    const expiresIn = 120

    return NextResponse.json({
      success: true,
      challengeId,
      expiresIn,
      demoOtp: randomOtp,
      message: 'Demo OTP generated successfully'
    })
  }

  // OTP Verification (Section 36)
  if (path === 'auth/otp/verify' || path.endsWith('/otp/verify')) {
    const enteredOtp = body.otp?.trim()
    const expectedOtp = body.expectedOtp?.trim()

    // In demo mode, if entered matches expected or length is 6 digits
    const valid = !expectedOtp || enteredOtp === expectedOtp || enteredOtp.length === 6

    if (valid) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'OTP verified successfully'
      })
    }
    return NextResponse.json({
      success: false,
      verified: false,
      message: 'Invalid OTP entered'
    }, { status: 400 })
  }

  // Payment Settlement (Section 40)
  if (path === 'payments/settle' || path.endsWith('/settle')) {
    const transactionId = body.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    return NextResponse.json({
      success: true,
      transactionId,
      status: 'SETTLED',
      settledAt: new Date().toISOString(),
      message: 'Simulated payment settled successfully in closed-loop ledger'
    })
  }

  // Payment Block (Section 45)
  if (path === 'payments/block' || path.endsWith('/block')) {
    const transactionId = body.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    return NextResponse.json({
      success: true,
      transactionId,
      status: 'BLOCKED',
      blockedAt: new Date().toISOString(),
      message: 'Payment blocked by UPIGuard AI Risk Engine. Zero balance changed.'
    })
  }

  // Demo Environment Reset (Section 68)
  if (path === 'demo/reset' || path === 'admin/reset-demo') {
    return NextResponse.json({
      success: true,
      message: 'UPIGuard AI demo environment restored to initial seed state',
      resetAt: new Date().toISOString()
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
      details: { entity_id, entity_label, entity_type, reason, linked_vpas } as any,
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
      details: { case_number: caseNum, entity_label, priority: 'Critical' } as any,
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
      transaction_reference: body.transaction_reference || `TXN-${Math.floor(10000 + Math.random() * 90000)}-UPI`,
      user_id: 1,
      merchant: body.merchant || body.receiver_name || 'UPI Transfer',
      amount: Number(body.amount) || 0,
      currency: 'INR',
      transaction_type: body.transaction_type || 'UPI',
      payment_method: body.payment_method || 'UPI App Intent',
      transaction_date: body.transaction_date || new Date().toISOString(),
      status: body.status || (assessment.decision === 'BLOCK' ? 'Blocked' : 'Completed'),
      flag_status: body.flag_status || (isSuspicious ? 'Suspicious' : 'Normal'),
      flag_reason: body.flag_reason || assessment.explainable_ai?.summary || '',
      has_report: false,
      upi_details: {
        receiver_name: body.merchant || body.receiver_name || 'Receiver',
        receiver_upi: body.receiver_upi || body.recipient_upi || 'receiver@upi'
      },
      risk_score: assessment.overall_risk_score,
      decision: assessment.decision
    }
    demoState.transactions.unshift(newTxn)

    // Simultaneously record in expenses ledger so Transactions & Expenses stay 100% unified
    if (newTxn.status !== 'Blocked' && newTxn.status !== 'Failed') {
      const cat = body.category || detectExpenseCategory(newTxn.merchant, body.note || '')
      const newExp = {
        id: Date.now(),
        amount: newTxn.amount,
        category: cat,
        merchant: newTxn.merchant,
        payment_method: newTxn.payment_method || 'UPI',
        date: newTxn.transaction_date,
        description: body.description || body.note || `Payment to ${newTxn.merchant}`,
        transaction_ref: newTxn.transaction_reference
      }
      demoState.expenses.unshift(newExp)
    }

    return NextResponse.json({
      success: true,
      transaction: newTxn,
      assessment: buildXaiResponse(assessment, normalized, DEFAULT_USER_BASELINE)
    })
  }

  // Create / Record Expense
  if (path === 'expenses') {
    const numAmt = Number(body.amount) || 0
    const cat = body.category || detectExpenseCategory(body.merchant || '', body.description || '')
    const newExp = {
      id: Date.now(),
      amount: numAmt,
      category: cat,
      merchant: body.merchant || 'Expense',
      payment_method: body.payment_method || 'UPI',
      date: body.date || new Date().toISOString(),
      description: body.description || 'Manual Expense'
    }
    demoState.expenses.unshift(newExp)

    // Mirror to transactions list so both lists remain unified
    const newTxn = {
      id: demoState.transactions.length + 1,
      transaction_reference: `TXN-${Math.floor(10000 + Math.random() * 90000)}-${(body.payment_method || 'UPI').toUpperCase().slice(0, 4)}`,
      user_id: 1,
      merchant: newExp.merchant,
      amount: newExp.amount,
      currency: 'INR',
      transaction_type: (body.payment_method || 'UPI').includes('Card') ? 'Card' : 'UPI',
      payment_method: body.payment_method || 'UPI',
      transaction_date: newExp.date,
      status: 'Completed',
      flag_status: 'Normal',
      flag_reason: '',
      has_report: false,
      upi_details: {
        receiver_name: newExp.merchant,
        receiver_upi: `${newExp.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`
      }
    }
    demoState.transactions.unshift(newTxn)

    return NextResponse.json(newExp, { status: 201 })
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
      details: { vpa, reason: body.reason || 'Flagged for suspicious activity' } as any,
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
      details: { devId, reason: body.reason || 'Flagged as emulator or compromised' } as any,
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
      status: 'ACTIVE' as const,
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
      user_mobile: '+91 98765 43210',
      assigned_admin_name: 'Unassigned',
      transaction_reference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
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
        details: { threshold_value: body.threshold_value, severity: body.severity, is_enabled: body.is_enabled, reason: body.reason } as any,
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

  // Objective 3: Model Feedback Submission
  if (path === 'model/feedback' || path === 'admin/model/feedback') {
    const record: FeedbackRecord = {
      id: `fb_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      transactionId: body.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: Number(body.amount) || 1000,
      receiverVpa: body.receiverVpa || body.receiver_upi || 'scammer.refund@okaxis',
      sourceApp: body.sourceApp || 'UPI App A',
      predictedRisk: Number(body.predictedRisk ?? body.predictedRiskScore ?? 50),
      predictedDecision: body.predictedDecision || 'ALLOW',
      actualOutcome: body.actualOutcome === 'FRAUD' ? 'FRAUD' : 'LEGITIMATE',
      feedbackSource: body.feedbackSource === 'DISPUTE_RAISED' ? 'DISPUTE_RAISED' : 'USER_CONFIRMATION',
      submittedAt: new Date().toISOString(),
      userNotes: body.notes || body.userNotes || 'Outcome feedback registered into training pipeline',
      isIncorporatedIntoDataset: false
    }

    demoState.feedbackRecords.unshift(record)
    const isFraud = record.actualOutcome === 'FRAUD'
    if (isFraud) {
      demoState.modelTrainingState.confirmed_fraud_samples += 1
    } else {
      demoState.modelTrainingState.confirmed_legit_samples += 1
    }
    demoState.modelTrainingState.newly_learned_samples += 1

    // Dynamic threshold update calculation
    const falsePositives = demoState.feedbackRecords.filter((f: any) => f.actualOutcome === 'LEGITIMATE' && f.predictedRisk >= 70).length
    const confirmedFrauds = demoState.feedbackRecords.filter((f: any) => f.actualOutcome === 'FRAUD').length
    const activePatternCount = demoState.fraudPatterns.filter((p: any) => p.status === 'ACTIVE').length
    const thresholdRecalc = recalculateDynamicAdaptiveThreshold(75.0, falsePositives, confirmedFrauds, activePatternCount)
    demoState.adaptiveThresholdHistory.unshift(thresholdRecalc)

    // Audit log
    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: body.admin_email || 'admin@upishield.ai',
      action: isFraud ? 'Fraud Confirmed by Feedback' : 'Legitimate Transaction Confirmed',
      target_type: 'Feedback',
      target_id: record.transactionId,
      ip_address: '103.212.144.18',
      details: { outcome: record.actualOutcome, predictedRisk: record.predictedRisk, newThreshold: thresholdRecalc.currentThreshold } as any,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Feedback stored for transaction ${record.transactionId}. Dataset updated.`,
      record,
      adaptiveThreshold: thresholdRecalc,
      unlearnedCount: demoState.modelTrainingState.newly_learned_samples
    })
  }

  // Objective 3: Model Retraining Trigger
  if (path === 'model/retrain' || path === 'admin/model/retrain') {
    const unlearnedCount = demoState.feedbackRecords.filter((f: any) => !f.isIncorporatedIntoDataset).length
    const { updatedState, newVersion } = executeModelRetraining(
      demoState.modelTrainingState,
      demoState.feedbackRecords
    )

    demoState.modelTrainingState = updatedState
    demoState.feedbackRecords.forEach((f: any) => {
      f.isIncorporatedIntoDataset = true
      f.incorporatedIntoVersion = newVersion
    })
    demoState.systemMetrics.modelAccuracy = updatedState.metrics.accuracy
    demoState.systemMetrics.lastModelRetrain = updatedState.last_retrained

    // Audit log
    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: body.admin_email || 'admin@upishield.ai',
      action: 'AI Model Retrained & Deployed',
      target_type: 'AI_Model',
      target_id: newVersion,
      ip_address: '103.212.144.18',
      details: {
        newVersion,
        samplesLearned: unlearnedCount,
        accuracy: updatedState.metrics.accuracy,
        recall: updatedState.metrics.recall,
        f1Score: updatedState.metrics.f1_score
      } as any,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Model successfully retrained with ${unlearnedCount} new feedback samples.`,
      newVersion,
      newlyLearnedCount: unlearnedCount,
      metrics: updatedState.metrics,
      changelog: `Self-learning update ${newVersion}`
    })
  }

  // Objective 3: Fraud Pattern Rule Management
  if (path.startsWith('fraud-patterns/') && (path.endsWith('/rule') || path.endsWith('/activate') || path.endsWith('/toggle'))) {
    const patternId = path.split('/')[1]
    const pattern = demoState.fraudPatterns.find((p: any) => p.id === patternId || p.pattern_key === patternId)
    if (pattern) {
      const enable = body.is_enabled !== undefined ? Boolean(body.is_enabled) : !pattern.is_rule_created
      pattern.is_rule_created = enable
      pattern.status = enable ? 'MITIGATED' : 'ACTIVE'

      demoState.auditLogs.unshift({
        id: demoState.auditLogs.length + 1,
        admin_email: body.admin_email || 'admin@upishield.ai',
        action: enable ? 'Fraud Rule Activated from Pattern' : 'Fraud Rule Deactivated',
        target_type: 'Fraud_Rule',
        target_id: pattern.pattern_name,
        ip_address: '103.212.144.18',
        details: { patternId, patternName: pattern.pattern_name, ruleActive: enable } as any,
        created_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: `Fraud rule for "${pattern.pattern_name}" ${enable ? 'activated' : 'deactivated'}.`,
        pattern
      })
    }
  }

  // Objective 3: Generic Common UPI API Ingestion
  if (path === 'upi/ingest' || path === 'payments/generic-ingest') {
    const sourceApp = body.sourceApp || body.upi_app || 'UPI App A'
    const senderVpa = body.senderVpa || body.sender_upi || 'payer@upiapp'
    const receiverVpa = body.receiverVpa || body.receiver_upi || 'merchant@upiapp'
    const receiverName = body.receiverName || body.receiver_name || 'Merchant Enterprise'
    const amount = Number(body.amount) || 1250
    const city = body.city || body.location?.city || 'Bengaluru'
    const isFraudAttempt = Boolean(body.isFraudAttempt || amount > 100000 || receiverVpa.includes('scam'))

    // Normalize & run modular AI pipeline: Ingestion -> Feature Extraction -> Models -> Risk Fusion -> Dynamic Score -> Decision
    const risk = calculateUpiGuardMasterRisk({
      amount,
      senderUpiId: senderVpa,
      receiverUpiId: receiverVpa,
      receiverName,
      isNewDevice: Boolean(body.isNewDevice),
      locationCity: city
    })

    const txnId = body.transactionId || `TXN-UPI-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    // Update UPI Provider statistics
    const provider = demoState.upiProviders.find(
      (p: any) =>
        p.app_name.toLowerCase().includes(sourceApp.toLowerCase()) ||
        p.app_code.toLowerCase() === sourceApp.toLowerCase() ||
        p.id.toLowerCase() === sourceApp.toLowerCase()
    )
    if (provider) {
      provider.transactions_processed += 1
      if (risk.decision === 'BLOCK' || risk.finalRisk >= 75) {
        provider.fraud_detected += 1
      } else {
        provider.legitimate_count += 1
      }
      provider.last_transaction_at = new Date().toISOString()
    }

    // Update System Monitoring Metrics
    demoState.systemMetrics.transactions_processed += 1
    demoState.systemMetrics.fraud_checks_completed += 1
    demoState.systemMetrics.activeProcessingCount = Math.max(1, (((demoState.systemMetrics.activeProcessingCount || 1) + 1) % 5))

    // Audit log
    demoState.auditLogs.unshift({
      id: demoState.auditLogs.length + 1,
      admin_email: 'system@upishield.ai',
      action: 'Cross-Platform UPI Ingestion',
      target_type: 'UPI_Transaction',
      target_id: txnId,
      ip_address: '103.212.144.18',
      details: { sourceApp, amount, riskScore: risk.finalRisk, decision: risk.decision } as any,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      transactionId: txnId,
      sourceApp,
      amount,
      riskScore: risk.finalRisk,
      riskLevel: risk.riskLevel,
      decision: risk.decision,
      riskFactors: risk.explanations,
      components: risk.components,
      timestamp: new Date().toISOString()
    })
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

  if (path.startsWith('expenses/')) {
    const id = Number(path.split('/')[1])
    demoState.expenses = demoState.expenses.filter((e: any) => e.id !== id)
    return NextResponse.json({ success: true, message: 'Expense removed' })
  }

  return NextResponse.json({ success: true, message: 'Removed successfully' })
}
