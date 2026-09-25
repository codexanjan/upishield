import { NextRequest, NextResponse } from 'next/server'

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
  ]
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

  if (path === 'notifications') {
    return NextResponse.json(demoState.notifications)
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
