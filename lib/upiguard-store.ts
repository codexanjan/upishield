import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FeedbackRecord,
  ModelTrainingState,
  FraudPattern,
  UpiProviderSource,
  SystemMetrics,
  INITIAL_FEEDBACK_RECORDS,
  INITIAL_FRAUD_PATTERNS,
  INITIAL_UPI_PROVIDERS,
  INITIAL_SYSTEM_METRICS,
  MODEL_PERFORMANCE_METRICS,
  executeModelRetraining,
  recalculateDynamicAdaptiveThreshold
} from '@/lib/ai-fraud-engine'

export interface DemoAccount {
  id: string
  name: string
  upiId: string
  type: 'USER' | 'MERCHANT' | 'ADMIN'
  balance: number
  pin: string
  location: string
  device: string
  normalRange: string
  avatar: string
  trustScore: number
}

export interface SimulationTransaction {
  id: string
  transactionId: string
  senderName: string
  senderUpiId: string
  receiverName: string
  receiverUpiId: string
  receiverType: 'MERCHANT' | 'USER'
  amount: number
  currency: string
  note: string
  source: 'QR' | 'INTENT' | 'MANUAL'
  qrReference?: string
  status: 'PENDING' | 'ANALYZING' | 'AUTH_REQUIRED' | 'OTP_REQUIRED' | 'APPROVED' | 'SETTLED' | 'BLOCKED' | 'FAILED'
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskFactors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
  mlProbability: number
  riskDecision: 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK'
  authMethod?: 'UPI_PIN' | 'FACE_SCAN'
  faceMatchScore?: number
  otpChallengeId?: string
  deviceId: string
  deviceTrust: number
  location: { city: string; region?: string; country: string }
  isMajorPurchase?: boolean
  purchaseCategory?: string
  paymentType?: 'FULL' | 'DOWN_PAYMENT'
  userConfirmation?: {
    status: 'PENDING' | 'CONFIRMED_ME' | 'REPORTED_NOT_ME' | 'EXPIRED'
    confirmedAt?: string
    confirmedDevice?: string
    confirmedLocation?: string
    confirmationMethod?: string
  }
  timestamps: {
    created: string
    analyzed?: string
    userConfirmed?: string
    authVerified?: string
    otpVerified?: string
    settled?: string
    blocked?: string
  }
  failureReason?: string
}

export interface MajorPurchase {
  id: string
  purchaseId: string
  transactionId: string
  userId: string
  userName: string
  merchantName: string
  merchantUpiId: string
  merchantId?: string
  category: 'Vehicle' | 'Bike' | 'Property' | 'Electronics' | 'Jewelry' | 'Education' | 'Medical' | 'Travel' | 'Business Equipment' | 'Custom'
  subcategory?: string
  description: string
  amount: number
  paymentType: 'FULL' | 'DOWN_PAYMENT'
  downPaymentAmount?: number
  remainingAmount?: number
  isLargeValue: boolean
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  decision: 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK'
  authMethod?: 'UPI_PIN' | 'FACE_SCAN'
  otpVerified: boolean
  deviceId: string
  location: { city: string; country: string }
  status: 'SETTLED' | 'BLOCKED' | 'PENDING' | 'SUCCESSFUL'
  createdAt: string
  settledAt?: string
}

export interface SecurityCase {
  id: string
  caseId: string
  transactionId: string
  userId: string
  userName: string
  merchantName: string
  merchantUpiId: string
  amount: number
  reason: 'USER_REPORTED_NOT_ME' | 'CRITICAL_RISK_POLICY' | 'IMPOSSIBLE_TRAVEL' | 'VELOCITY_ATTACK' | 'SUSPICIOUS_COLLECT_REQUEST'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'UNDER_REVIEW' | 'USER_CONTACT_REQUIRED' | 'RESOLVED' | 'FALSE_ALARM' | 'ESCALATED'
  createdAt: string
  deviceId: string
  location: string
  riskScore: number
  confirmationStatus: 'REPORTED_NOT_ME' | 'CONFIRMED_ME' | 'AUTO_BLOCKED'
  investigationNotes?: string
}

export interface IncomingPaymentRequest {
  id: string
  requestId: string
  senderName: string
  senderUpiId: string
  amount: number
  note: string
  category: string
  createdAt: string
  status: 'PENDING' | 'ACCEPTED' | 'REPORTED'
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskDecision: 'ALLOW' | 'VERIFY' | 'BLOCK'
  riskFactors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
  xaiReason?: string
}

export interface ActivePaymentRequest {
  id: string
  merchantName: string
  merchantUpiId: string
  amount: number
  note: string
  qrPayload: string
  createdAt: string
  status: 'WAITING' | 'SCANNED' | 'PAYING' | 'SETTLED' | 'EXPIRED'
  payerUpiId?: string
  payerName?: string
  settledTransactionId?: string
}

export interface FraudAlert {
  id: string
  alertId: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  transactionId: string
  amount: number
  userId: string
  createdAt: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  resolution?: string
}

// ==========================================
// VIRTUAL CREDIT CARD MODULE MODELS (Master Spec)
// ==========================================
export type CardType = 'VIRTUAL_CREDIT' | 'VIRTUAL_SHOPPING' | 'VIRTUAL_TRAVEL' | 'VIRTUAL_SUBSCRIPTION'
export type CardTheme = 'Midnight' | 'Cyber' | 'Aurora' | 'Titanium' | 'Minimal' | 'Electric'
export type CardStatus = 'ACTIVE' | 'FROZEN' | 'LOCKED' | 'DELETED' | 'REVOKED'

export interface VirtualCard {
  cardId: string
  userId: string
  nickname: string
  cardType: CardType
  purpose: string
  theme: CardTheme
  displayNumber: string // Synthetic demo format e.g. "VG-DEMO-4821"
  maskedNumber: string // "•••• •••• •••• 4821"
  syntheticToken: string // "VG-SEC-4821-DEMO-TOKEN"
  expiryMonth: string // "12"
  expiryYear: string // "29"
  demoCvv: string // "482"
  status: CardStatus
  lockedUntil?: string | null
  creditLimit: number // e.g. 2,00,000 or 10,00,000
  usedCredit: number // e.g. 38,500
  availableCredit: number // e.g. 1,61,500
  dailyLimit: number // e.g. 50,000
  monthlyLimit: number // e.g. 1,00,000
  onlineLimit: number // e.g. 80,000
  contactlessLimit: number // e.g. 5,000
  categoryLimits: Record<string, number>
  allowedCategories: string[]
  blockedCategories: string[]
  allowedCities: string[]
  blockedCities: string[]
  homeLocation: string // "Hubballi"
  travelMode: boolean
  travelDestination?: string
  travelDates?: string
  locationProtection: boolean
  deviceProtection: boolean
  aiFraudProtection: boolean
  transactionAlerts: boolean
  authenticationRequired: boolean
  otpRequired: boolean
  autoFreezeOnCriticalRisk: boolean
  securityScore: number // 0-100 (e.g. 94)
  riskScore: number // 0-100 (e.g. 12)
  createdAt: string
  updatedAt: string
  frozenAt?: string
  revokedAt?: string
}

export interface CardTransaction {
  transactionId: string
  cardId: string
  userId: string
  merchantId: string
  merchantName: string
  merchantCategory: string
  amount: number
  currency: string
  paymentChannel: 'Online' | 'POS' | 'Contactless' | 'QR' | 'In-App' | 'Recurring'
  location: {
    city: string
    state?: string
    country: string
    latitude?: number
    longitude?: number
    knownLocation: boolean
    distanceKm?: number
    locationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
  device: {
    deviceId: string
    deviceName: string
    browser: string
    os: string
    knownDevice: boolean
    trustScore: number
    deviceRisk: 'LOW' | 'HIGH'
  }
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskFactors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
  mlProbability: number
  userConfirmation: 'PENDING' | 'CONFIRMED_ME' | 'REPORTED_NOT_ME' | 'BYPASSED'
  authenticationMethod: 'PIN' | 'FACE_SCAN' | 'OTP' | 'NONE'
  otpVerified: boolean
  status: 'PENDING' | 'AUTHORIZED' | 'SETTLED' | 'DECLINED' | 'BLOCKED' | 'REFUNDED'
  decision: 'APPROVED' | 'BLOCKED' | 'STEP_UP_AUTH'
  authorizationCode?: string
  description?: string
  createdAt: string
  settledAt?: string
  blockedAt?: string
  refundedAt?: string
}

export interface CardSubscription {
  id: string
  cardId: string
  name: string
  merchantName: string
  amount: number
  frequency: 'Monthly' | 'Yearly'
  nextBillingDate: string
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  category: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'TRANSACTION' | 'FRAUD_REPORT' | 'CASE_UPDATE' | 'SECURITY_ALERT' | 'WALLET' | 'LOCATION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'SUCCESS'
  referenceId?: string
  recipientRole: 'USER' | 'ADMIN' | 'ALL'
  isRead: boolean
  createdAt: string
  link?: string
}

export const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_init_1',
    title: 'Wallet Funded: ₹1,00,00,000 (1 Crore)',
    message: '₹1,00,00,000 credited to your primary UPI Shield AI wallet. Full interception and biometric protection active.',
    type: 'WALLET',
    severity: 'SUCCESS',
    recipientRole: 'USER',
    isRead: false,
    createdAt: new Date().toISOString(),
    link: '/dashboard'
  },
  {
    id: 'notif_init_2',
    title: 'AI Multi-Model Fraud Engine Operational',
    message: 'Isolation Forest anomaly detection & XGBoost models synchronized with live Google Maps telemetry.',
    type: 'SECURITY_ALERT',
    severity: 'LOW',
    recipientRole: 'ALL',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    link: '/dashboard/risk-profile'
  },
  {
    id: 'notif_init_3',
    title: 'Admin Sentinel: Geofence Active',
    message: 'Global impossible travel detector initialized across 18 banking clusters with real coordinates.',
    type: 'LOCATION',
    severity: 'LOW',
    recipientRole: 'ADMIN',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    link: '/admin/locations'
  }
]

export const INITIAL_DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  'anjan@upiguard': {
    id: 'usr_anjan',
    name: 'Anjan Shetty',
    upiId: 'anjan@upiguard',
    type: 'USER',
    balance: 10000000, // ₹1,00,00,000 (1 Crore INR)
    pin: '2580',
    location: 'Hubballi',
    device: 'Anjan-Laptop (Known Trust: 94)',
    normalRange: '₹100–₹5,000',
    avatar: 'AS',
    trustScore: 94
  },
  'rahul@upiguard': {
    id: 'usr_rahul',
    name: 'Rahul Kumar',
    upiId: 'rahul@upiguard',
    type: 'USER',
    balance: 75000,
    pin: '4821',
    location: 'Bengaluru',
    device: 'Pixel-8-Pro',
    normalRange: '₹200–₹8,000',
    avatar: 'RK',
    trustScore: 88
  },
  'priya@upiguard': {
    id: 'usr_priya',
    name: 'Priya Sharma',
    upiId: 'priya@upiguard',
    type: 'USER',
    balance: 60000,
    pin: '7314',
    location: 'Mumbai',
    device: 'iPhone-15',
    normalRange: '₹500–₹10,000',
    avatar: 'PS',
    trustScore: 91
  },
  'abc@upiguard': {
    id: 'mer_abc',
    name: 'ABC Electronics',
    upiId: 'abc@upiguard',
    type: 'MERCHANT',
    balance: 50000,
    pin: '1234',
    location: 'Hubballi',
    device: 'Terminal-ABC-01',
    normalRange: '₹1,000–₹80,000',
    avatar: 'ABC',
    trustScore: 96
  },
  'coffee@upiguard': {
    id: 'mer_coffee',
    name: 'UPIGuard Coffee',
    upiId: 'coffee@upiguard',
    type: 'MERCHANT',
    balance: 25000,
    pin: '1122',
    location: 'Hubballi',
    device: 'POS-Coffee-Hubballi',
    normalRange: '₹50–₹1,500',
    avatar: 'UGC',
    trustScore: 98
  },
  'abcmotors@upiguard': {
    id: 'mer_abcmotors',
    name: 'ABC Motors',
    upiId: 'abcmotors@upiguard',
    type: 'MERCHANT',
    balance: 250000,
    pin: '1234',
    location: 'Hubballi',
    device: 'POS-Motors-Hubballi',
    normalRange: '₹50,000–₹25,00,000',
    avatar: 'ABCM',
    trustScore: 98
  },
  'admin@upiguard': {
    id: 'adm_platform',
    name: 'Platform Administrator',
    upiId: 'admin@upiguard',
    type: 'ADMIN',
    balance: 0,
    pin: '9999',
    location: 'Hubballi / Central SOC',
    device: 'SecOps-Workstation',
    normalRange: 'N/A',
    avatar: 'ADM',
    trustScore: 100
  }
}

export const INITIAL_MAJOR_PURCHASES: MajorPurchase[] = [
  {
    id: 'mp-01',
    purchaseId: 'MP-91024',
    transactionId: 'TXN-71920',
    userId: 'anjan@upiguard',
    userName: 'Anjan Shetty',
    merchantName: 'XYZ Store',
    merchantUpiId: 'xyz.store@upiguard',
    category: 'Electronics',
    description: 'Apple MacBook Pro M3 Workstation',
    amount: 75000,
    paymentType: 'FULL',
    isLargeValue: true,
    riskScore: 28,
    riskLevel: 'LOW',
    decision: 'ALLOW',
    authMethod: 'FACE_SCAN',
    otpVerified: true,
    deviceId: 'Anjan-Laptop',
    location: { city: 'Hubballi', country: 'India' },
    status: 'SETTLED',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    settledAt: new Date(Date.now() - 86400000 * 3 + 20000).toISOString()
  },
  {
    id: 'mp-02',
    purchaseId: 'MP-91021',
    transactionId: 'TXN-71911',
    userId: 'anjan@upiguard',
    userName: 'Anjan Shetty',
    merchantName: 'ABC Institute',
    merchantUpiId: 'institute@upiguard',
    category: 'Education',
    description: 'Executive AI Master Certification Semester Fee',
    amount: 45000,
    paymentType: 'FULL',
    isLargeValue: true,
    riskScore: 22,
    riskLevel: 'LOW',
    decision: 'ALLOW',
    authMethod: 'UPI_PIN',
    otpVerified: true,
    deviceId: 'Anjan-Laptop',
    location: { city: 'Hubballi', country: 'India' },
    status: 'SETTLED',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    settledAt: new Date(Date.now() - 86400000 * 7 + 15000).toISOString()
  }
]

export const INITIAL_CASES: SecurityCase[] = [
  {
    id: 'case-01',
    caseId: 'CASE-84915',
    transactionId: 'TXN-84915',
    userId: 'anjan@upiguard',
    userName: 'Anjan Shetty',
    merchantName: 'Overseas Tech Support',
    merchantUpiId: 'scammer.refund@okaxis',
    amount: 75000,
    reason: 'CRITICAL_RISK_POLICY',
    severity: 'CRITICAL',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    deviceId: 'Unknown-Android-Device-X9',
    location: 'Mumbai',
    riskScore: 95,
    confirmationStatus: 'AUTO_BLOCKED',
    investigationNotes: 'Blocked by autonomous risk policy due to location divergence & untrusted device.'
  }
]

export const INITIAL_INCOMING_REQUESTS: IncomingPaymentRequest[] = [
  {
    id: 'inc-01',
    requestId: 'REQ-INC-2041',
    senderName: 'Rahul Kumar',
    senderUpiId: 'rahul@upiguard',
    amount: 2500,
    note: 'Hackathon Project Cloud Expense Share',
    category: 'Education',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'PENDING',
    riskScore: 6,
    riskLevel: 'LOW',
    riskDecision: 'ALLOW',
    riskFactors: [
      { name: 'Known Trusted Contact', score: 1, description: 'Verified peer in your frequent contact circle', importance: 'LOW' },
      { name: 'Normal Request Amount', score: 2, description: 'Aligned with typical split expenses', importance: 'LOW' },
      { name: 'Valid VPA Signature', score: 1, description: 'Sender bank routing verified', importance: 'LOW' }
    ]
  },
  {
    id: 'inc-02',
    requestId: 'REQ-INC-9912',
    senderName: 'Central Tax Support Refund Desk',
    senderUpiId: 'refund.desk@fakeupi',
    amount: 15000,
    note: 'Urgent Tax Rebate Disbursal Processing Fee',
    category: 'Bills',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'PENDING',
    riskScore: 89,
    riskLevel: 'HIGH',
    riskDecision: 'VERIFY',
    riskFactors: [
      { name: 'Spoofed Government Header', score: 32, description: 'Sender attempts impersonation of official financial authority', importance: 'CRITICAL' },
      { name: 'Unverified Non-Standard VPA', score: 28, description: 'Synthetic VPA not registered on trusted rails', importance: 'HIGH' },
      { name: 'High Risk Chargeback Pattern', score: 18, description: 'Reverse collect request flagged across security radar', importance: 'HIGH' }
    ]
  }
]

export interface AppExpense {
  id: string | number
  transactionId?: string
  transaction_reference?: string
  transaction_ref?: string
  amount: number
  category: string
  merchant: string
  payment_method: string
  date: string
  description?: string
  recurring?: boolean
}

export function detectCategoryFromMerchant(merchant?: string, note?: string): string {
  const text = `${merchant || ''} ${note || ''}`.toLowerCase()
  if (text.includes('coffee') || text.includes('cafe') || text.includes('tea') || text.includes('food') || text.includes('swiggy') || text.includes('zomato') || text.includes('restaurant') || text.includes('lunch') || text.includes('dinner') || text.includes('snack')) return 'Food'
  if (text.includes('grocer') || text.includes('basket') || text.includes('supermarket') || text.includes('fresh') || text.includes('mart') || text.includes('vegetable') || text.includes('milk') || text.includes('provision')) return 'Groceries'
  if (text.includes('bescom') || text.includes('bill') || text.includes('electric') || text.includes('power') || text.includes('utility') || text.includes('water') || text.includes('gas') || text.includes('broadband') || text.includes('wifi') || text.includes('fiber')) return 'Bills'
  if (text.includes('uber') || text.includes('ola') || text.includes('flight') || text.includes('train') || text.includes('metro') || text.includes('irctc') || text.includes('travel') || text.includes('airline') || text.includes('fuel') || text.includes('petrol')) return 'Travel'
  if (text.includes('movie') || text.includes('netflix') || text.includes('cinema') || text.includes('spotify') || text.includes('prime') || text.includes('game') || text.includes('entertainment')) return 'Entertainment'
  if (text.includes('hospital') || text.includes('pharma') || text.includes('apollo') || text.includes('clinic') || text.includes('med') || text.includes('doctor') || text.includes('dental')) return 'Healthcare'
  if (text.includes('school') || text.includes('college') || text.includes('course') || text.includes('fee') || text.includes('tuition') || text.includes('institute') || text.includes('academy')) return 'Education'
  if (text.includes('motors') || text.includes('auto') || text.includes('car') || text.includes('bike') || text.includes('vehicle')) return 'Vehicle'
  if (text.includes('store') || text.includes('amazon') || text.includes('flipkart') || text.includes('electronics') || text.includes('apple') || text.includes('myntra') || text.includes('uniqlo') || text.includes('retail') || text.includes('mall') || text.includes('shop')) return 'Shopping'
  return 'Shopping'
}

export const INITIAL_APP_EXPENSES: AppExpense[] = [
  {
    id: 'exp-01',
    transactionId: 'TXN-84920',
    transaction_reference: 'TXN-84920',
    amount: 250,
    category: 'Food',
    merchant: 'UPIGuard Coffee',
    payment_method: 'UPI',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    description: 'Morning espresso and croissant'
  },
  {
    id: 'exp-02',
    transactionId: 'TXN-84918',
    transaction_reference: 'TXN-84918',
    amount: 1250,
    category: 'Shopping',
    merchant: 'ABC Electronics',
    payment_method: 'UPI',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Wireless Mouse'
  },
  {
    id: 'exp-03',
    transactionId: 'TXN-2026-C303',
    transaction_reference: 'TXN-2026-C303',
    amount: 3420,
    category: 'Groceries',
    merchant: "Nature's Basket",
    payment_method: 'Card',
    date: new Date(Date.now() - 172800000).toISOString(),
    description: 'Pantry restocking'
  },
  {
    id: 'exp-04',
    transactionId: 'TXN-2026-B202',
    transaction_reference: 'TXN-2026-B202',
    amount: 4200,
    category: 'Bills',
    merchant: 'BESCOM Electricity',
    payment_method: 'UPI',
    date: new Date(Date.now() - 259200000).toISOString(),
    description: 'Monthly electricity bill'
  },
  {
    id: 'exp-05',
    transactionId: 'TXN-71920',
    transaction_reference: 'TXN-71920',
    amount: 5800,
    category: 'Shopping',
    merchant: 'Uniqlo Indiranagar',
    payment_method: 'UPI',
    date: new Date(Date.now() - 345600000).toISOString(),
    description: 'Autumn clothing'
  }
]

export const INITIAL_TRANSACTIONS: SimulationTransaction[] = [
  {
    id: 'seed-txn-01',
    transactionId: 'TXN-84920',
    senderName: 'Anjan Shetty',
    senderUpiId: 'anjan@upiguard',
    receiverName: 'UPIGuard Coffee',
    receiverUpiId: 'coffee@upiguard',
    receiverType: 'MERCHANT',
    amount: 250,
    currency: 'INR',
    note: 'Morning Espresso & Croissant',
    source: 'QR',
    status: 'SETTLED',
    riskScore: 8,
    riskLevel: 'LOW',
    riskFactors: [
      { name: 'Known Device', score: 2, description: 'Matched Anjan-Laptop keystore', importance: 'LOW' },
      { name: 'Familiar Location', score: 1, description: 'Hubballi home radius verified', importance: 'LOW' },
      { name: 'Established Merchant', score: 2, description: 'Known trusted local coffee partner', importance: 'LOW' },
      { name: 'Ticket Size Aligned', score: 3, description: '₹250 is within typical micro-spend range', importance: 'LOW' }
    ],
    mlProbability: 0.02,
    riskDecision: 'ALLOW',
    authMethod: 'FACE_SCAN',
    faceMatchScore: 0.92,
    deviceId: 'Anjan-Laptop',
    deviceTrust: 96,
    location: { city: 'Hubballi', country: 'India' },
    timestamps: {
      created: new Date(Date.now() - 3600000 * 4).toISOString(),
      settled: new Date(Date.now() - 3600000 * 4 + 15000).toISOString()
    }
  },
  {
    id: 'seed-txn-02',
    transactionId: 'TXN-84918',
    senderName: 'Rahul Kumar',
    senderUpiId: 'rahul@upiguard',
    receiverName: 'ABC Electronics',
    receiverUpiId: 'abc@upiguard',
    receiverType: 'MERCHANT',
    amount: 1250,
    currency: 'INR',
    note: 'Wireless Mouse',
    source: 'QR',
    status: 'SETTLED',
    riskScore: 14,
    riskLevel: 'LOW',
    riskFactors: [
      { name: 'Standard Transaction Amount', score: 4, description: 'Within regular consumer budget', importance: 'LOW' },
      { name: 'Verified Merchant', score: 3, description: 'ABC Electronics verified merchant identity', importance: 'LOW' }
    ],
    mlProbability: 0.05,
    riskDecision: 'ALLOW',
    authMethod: 'UPI_PIN',
    deviceId: 'Pixel-8-Pro',
    deviceTrust: 90,
    location: { city: 'Bengaluru', country: 'India' },
    timestamps: {
      created: new Date(Date.now() - 3600000 * 9).toISOString(),
      settled: new Date(Date.now() - 3600000 * 9 + 12000).toISOString()
    }
  },
  {
    id: 'seed-txn-03',
    transactionId: 'TXN-84915',
    senderName: 'Anjan Shetty',
    senderUpiId: 'anjan@upiguard',
    receiverName: 'Overseas Tech Support',
    receiverUpiId: 'scammer.refund@okaxis',
    receiverType: 'USER',
    amount: 75000,
    currency: 'INR',
    note: 'Urgent Wire Transfer',
    source: 'INTENT',
    status: 'BLOCKED',
    riskScore: 95,
    riskLevel: 'CRITICAL',
    riskFactors: [
      { name: 'Extreme High-Value Amount', score: 22, description: '₹75,000 exceeds 15x normal baseline', importance: 'CRITICAL' },
      { name: 'Unrecognized Device Endpoint', score: 20, description: 'Hardware endpoint trust score 18/100', importance: 'CRITICAL' },
      { name: 'Location Geofence Divergence', score: 15, description: 'Transaction originated from Mumbai (~1,300 km from Hubballi)', importance: 'HIGH' },
      { name: 'First-Time Receiver Encounter', score: 12, description: 'Never previously transacted with this VPA', importance: 'MEDIUM' },
      { name: 'Multivariate Behavior Anomaly', score: 18, description: 'Simultaneous departure across time, device and sum', importance: 'CRITICAL' },
      { name: 'ML Classifier Flag', score: 8, description: 'Supervised Random Forest evaluated 91.7% fraud likelihood', importance: 'HIGH' }
    ],
    mlProbability: 0.917,
    riskDecision: 'BLOCK',
    deviceId: 'Unknown-Android-Device-X9',
    deviceTrust: 18,
    location: { city: 'Mumbai', country: 'India' },
    timestamps: {
      created: new Date(Date.now() - 3600000 * 18).toISOString(),
      blocked: new Date(Date.now() - 3600000 * 18 + 5000).toISOString()
    },
    failureReason: 'CRITICAL_RISK_POLICY_PREVENTION'
  }
]

export const INITIAL_ALERTS: FraudAlert[] = [
  {
    id: 'alt-01',
    alertId: 'ALT-9921',
    severity: 'CRITICAL',
    title: 'High-Value Account Takeover Attempt Prevented',
    description: '₹75,000 payment to unverified beneficiary blocked before settlement from Mumbai.',
    transactionId: 'TXN-84915',
    amount: 75000,
    userId: 'anjan@upiguard',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'OPEN'
  },
  {
    id: 'alt-02',
    alertId: 'ALT-9920',
    severity: 'MEDIUM',
    title: 'New Device Registration from Secondary City',
    description: 'Anjan-Laptop secondary session refreshed from Bengaluru.',
    transactionId: 'TXN-84918',
    amount: 1250,
    userId: 'anjan@upiguard',
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    status: 'RESOLVED',
    resolution: 'Verified via OTP challenge'
  }
]

export const INITIAL_DEMO_CARDS: VirtualCard[] = [
  {
    cardId: 'card_primary_01',
    userId: 'usr_anjan',
    nickname: 'My Primary Card',
    cardType: 'VIRTUAL_CREDIT',
    purpose: 'General Spending',
    theme: 'Cyber',
    displayNumber: 'VG-DEMO-4821',
    maskedNumber: '•••• •••• •••• 4821',
    syntheticToken: 'VG-SEC-4821-DEMO-TOKEN',
    expiryMonth: '12',
    expiryYear: '29',
    demoCvv: '482',
    status: 'ACTIVE',
    creditLimit: 200000,
    usedCredit: 38500,
    availableCredit: 161500,
    dailyLimit: 50000,
    monthlyLimit: 100000,
    onlineLimit: 80000,
    contactlessLimit: 5000,
    categoryLimits: { Shopping: 20000, Travel: 15000, Dining: 5000, Subscriptions: 3000, Electronics: 150000 },
    allowedCategories: ['Electronics', 'Shopping', 'Travel', 'Food', 'Healthcare', 'Education', 'Entertainment', 'Subscription', 'Fuel', 'Dining', 'Automotive'],
    blockedCategories: ['Gambling', 'Crypto Speculation'],
    allowedCities: ['Hubballi', 'Dharwad', 'Bengaluru'],
    blockedCities: [],
    homeLocation: 'Hubballi',
    travelMode: false,
    locationProtection: true,
    deviceProtection: true,
    aiFraudProtection: true,
    transactionAlerts: true,
    authenticationRequired: true,
    otpRequired: true,
    autoFreezeOnCriticalRisk: false,
    securityScore: 94,
    riskScore: 12,
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z'
  },
  {
    cardId: 'card_travel_02',
    userId: 'usr_anjan',
    nickname: 'Travel & Airlines Card',
    cardType: 'VIRTUAL_TRAVEL',
    purpose: 'Travel purchases & Hotels',
    theme: 'Aurora',
    displayNumber: 'VG-DEMO-1024',
    maskedNumber: '•••• •••• •••• 1024',
    syntheticToken: 'VG-SEC-1024-DEMO-TOKEN',
    expiryMonth: '08',
    expiryYear: '28',
    demoCvv: '739',
    status: 'ACTIVE',
    creditLimit: 100000,
    usedCredit: 15000,
    availableCredit: 85000,
    dailyLimit: 30000,
    monthlyLimit: 60000,
    onlineLimit: 50000,
    contactlessLimit: 5000,
    categoryLimits: { Travel: 50000, Hotel: 30000, Airlines: 50000 },
    allowedCategories: ['Travel', 'Hotel', 'Airlines', 'Dining', 'Shopping'],
    blockedCategories: ['Gaming'],
    allowedCities: ['Hubballi', 'Bengaluru', 'Mumbai', 'Singapore'],
    blockedCities: [],
    homeLocation: 'Hubballi',
    travelMode: true,
    travelDestination: 'Mumbai & Singapore',
    travelDates: '28 Sep – 05 Oct',
    locationProtection: true,
    deviceProtection: true,
    aiFraudProtection: true,
    transactionAlerts: true,
    authenticationRequired: true,
    otpRequired: true,
    autoFreezeOnCriticalRisk: true,
    securityScore: 91,
    riskScore: 24,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z'
  }
]

export const INITIAL_CARD_TRANSACTIONS: CardTransaction[] = [
  {
    transactionId: 'CTXN-82731',
    cardId: 'card_primary_01',
    userId: 'usr_anjan',
    merchantId: 'mer_abc',
    merchantName: 'ABC Electronics',
    merchantCategory: 'Electronics',
    amount: 8500,
    currency: 'INR',
    paymentChannel: 'Online',
    location: {
      city: 'Hubballi',
      country: 'India',
      knownLocation: true,
      distanceKm: 0,
      locationRisk: 'LOW'
    },
    device: {
      deviceId: 'dev_laptop',
      deviceName: 'Anjan-Laptop',
      browser: 'Chrome 128',
      os: 'Windows 11',
      knownDevice: true,
      trustScore: 94,
      deviceRisk: 'LOW'
    },
    riskScore: 22,
    riskLevel: 'LOW',
    riskFactors: [
      { name: 'Known Merchant', score: 10, description: 'Frequent merchant history verified', importance: 'LOW' },
      { name: 'Home Location Match', score: 5, description: 'Origin matches Hubballi baseline', importance: 'LOW' },
      { name: 'Trusted Device', score: 7, description: 'Hardware fingerprint trust 94%', importance: 'LOW' }
    ],
    mlProbability: 0.12,
    userConfirmation: 'CONFIRMED_ME',
    authenticationMethod: 'FACE_SCAN',
    otpVerified: true,
    status: 'SETTLED',
    decision: 'APPROVED',
    authorizationCode: 'AUTH-DEMO-91823',
    description: 'Monitor & Accessories',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    settledAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    transactionId: 'CTXN-82730',
    cardId: 'card_primary_01',
    userId: 'usr_anjan',
    merchantId: 'mer_coffee',
    merchantName: 'UPIGuard Coffee',
    merchantCategory: 'Food',
    amount: 250,
    currency: 'INR',
    paymentChannel: 'Contactless',
    location: {
      city: 'Hubballi',
      country: 'India',
      knownLocation: true,
      distanceKm: 2.1,
      locationRisk: 'LOW'
    },
    device: {
      deviceId: 'dev_pixel',
      deviceName: 'Pixel-8-Pro',
      browser: 'Mobile App',
      os: 'Android 15',
      knownDevice: true,
      trustScore: 92,
      deviceRisk: 'LOW'
    },
    riskScore: 8,
    riskLevel: 'LOW',
    riskFactors: [
      { name: 'Frequent Micro-Spend', score: 4, description: 'Routine dining/coffee spend pattern', importance: 'LOW' }
    ],
    mlProbability: 0.04,
    userConfirmation: 'BYPASSED',
    authenticationMethod: 'PIN',
    otpVerified: true,
    status: 'SETTLED',
    decision: 'APPROVED',
    authorizationCode: 'AUTH-DEMO-10294',
    description: 'Espresso & Croissant',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    settledAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    transactionId: 'CTXN-82729',
    cardId: 'card_primary_01',
    userId: 'usr_anjan',
    merchantId: 'mer_apple_delhi',
    merchantName: 'Apple Store Aerocity',
    merchantCategory: 'Electronics',
    amount: 89900,
    currency: 'INR',
    paymentChannel: 'POS',
    location: {
      city: 'Delhi',
      country: 'India',
      knownLocation: false,
      distanceKm: 1650,
      locationRisk: 'CRITICAL'
    },
    device: {
      deviceId: 'dev_unknown_del',
      deviceName: 'Untrusted POS Terminal DEL-9941',
      browser: 'Embedded POS',
      os: 'Linux Embedded',
      knownDevice: false,
      trustScore: 24,
      deviceRisk: 'HIGH'
    },
    riskScore: 92,
    riskLevel: 'CRITICAL',
    riskFactors: [
      { name: 'Impossible Travel Velocity', score: 45, description: '1,650 km from Hubballi in 28 mins (implausible flight speed)', importance: 'CRITICAL' },
      { name: 'New Untrusted Device', score: 25, description: 'Terminal ID never seen on user profile', importance: 'HIGH' },
      { name: 'Spend Velocity Spike', score: 22, description: 'Exceeds standard 30-day spend deviation', importance: 'HIGH' }
    ],
    mlProbability: 0.94,
    userConfirmation: 'REPORTED_NOT_ME',
    authenticationMethod: 'NONE',
    otpVerified: false,
    status: 'BLOCKED',
    decision: 'BLOCKED',
    description: 'Unauthorized High-Value Electronics Attempt',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    blockedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
]

export const INITIAL_CARD_SUBSCRIPTIONS: CardSubscription[] = [
  {
    id: 'sub_01',
    cardId: 'card_primary_01',
    name: 'Netflix Premium 4K Demo',
    merchantName: 'Netflix India',
    amount: 649,
    frequency: 'Monthly',
    nextBillingDate: '2026-10-12',
    status: 'ACTIVE',
    category: 'Subscription'
  },
  {
    id: 'sub_02',
    cardId: 'card_primary_01',
    name: 'Spotify Premium Family Demo',
    merchantName: 'Spotify AB',
    amount: 199,
    frequency: 'Monthly',
    nextBillingDate: '2026-10-18',
    status: 'ACTIVE',
    category: 'Subscription'
  },
  {
    id: 'sub_03',
    cardId: 'card_primary_01',
    name: 'Google Cloud Workstation Demo',
    merchantName: 'Google Cloud Platform',
    amount: 999,
    frequency: 'Monthly',
    nextBillingDate: '2026-10-05',
    status: 'ACTIVE',
    category: 'Subscription'
  }
]

// Realtime cross-tab broadcast singleton
let realtimeChannel: BroadcastChannel | null = null
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!realtimeChannel) {
      try {
        realtimeChannel = new BroadcastChannel('upiguard_realtime')
      } catch (e) {
        console.warn('BroadcastChannel not available', e)
      }
    }
    return realtimeChannel
  }
  return null
}

function broadcastEvent(type: string, payload: any) {
  const ch = getBroadcastChannel()
  if (ch) {
    ch.postMessage({ type, payload, timestamp: Date.now() })
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upiguard_event', { detail: { type, payload } }))
  }
}

interface UPIGuardState {
  // Accounts & Balances
  accounts: Record<string, DemoAccount>
  activeUserUpi: string
  activeMerchantUpi: string
  
  // Real-time Payments
  activePaymentRequest: ActivePaymentRequest | null
  transactions: SimulationTransaction[]
  alerts: FraudAlert[]
  majorPurchases: MajorPurchase[]
  cases: SecurityCase[]
  incomingRequests: IncomingPaymentRequest[]

  // Objective 3: Self-Learning, Fraud Patterns & Multiple UPI Applications
  feedbackRecords: FeedbackRecord[]
  modelTrainingState: ModelTrainingState
  fraudPatterns: FraudPattern[]
  upiProviders: UpiProviderSource[]
  systemMetrics: SystemMetrics

  // Virtual Credit Card Simulation Module State
  virtualCards: VirtualCard[]
  cardTransactions: CardTransaction[]
  cardSubscriptions: CardSubscription[]
  activeCardId: string | null
  
  // Live Demo Scenario Simulator Config
  activeScenario: string | null
  scenarioParams: {
    amount?: number
    receiverUpi?: string
    receiverName?: string
    isNewDevice?: boolean
    locationCity?: string
    isRapidVelocity?: boolean
    tamperedQr?: boolean
  }

  // OTP Challenges in-memory
  currentOtpChallenge: {
    challengeId: string
    paymentId: string
    otp: string
    expiresAt: number
    attemptsRemaining: number
    verified: boolean
  } | null

  // Core Actions
  setActiveUser: (upiId: string) => void
  setActiveMerchant: (upiId: string) => void
  
  // Merchant actions
  createMerchantQrRequest: (merchantUpi: string, amount: number, note: string) => ActivePaymentRequest
  clearActivePaymentRequest: () => void
  
  // User Payment Flow
  initiatePayment: (payload: {
    senderUpiId: string
    receiverUpiId: string
    receiverName: string
    amount: number
    note?: string
    source?: 'QR' | 'INTENT' | 'MANUAL'
    qrReference?: string
    isMajorPurchase?: boolean
    purchaseCategory?: string
    paymentType?: 'FULL' | 'DOWN_PAYMENT'
  }) => SimulationTransaction

  confirmUserTransaction: (transactionId: string, isConfirmed: boolean) => { success: boolean; caseCreated?: SecurityCase }

  updateTransactionRisk: (
    transactionId: string,
    risk: {
      score: number
      level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      decision: 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK'
      factors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
      mlProbability: number
    }
  ) => void

  verifyPin: (transactionId: string, enteredPin: string) => { success: boolean; message: string }
  verifyFace: (transactionId: string, matchScore: number) => { success: boolean; message: string }
  
  requestOtp: (transactionId: string) => { challengeId: string; demoOtp: string; expiresIn: number }
  verifyOtp: (challengeId: string, enteredOtp: string) => { success: boolean; message: string }
  
  settlePayment: (transactionId: string) => { success: boolean; message: string; transaction?: SimulationTransaction }
  blockPayment: (transactionId: string, reason: string) => { success: boolean; message: string }
  
  // Major Purchase Actions
  recordMajorPurchase: (purchase: Omit<MajorPurchase, 'id' | 'createdAt'>) => MajorPurchase

  // Incoming / Collect Request Actions
  acceptIncomingRequest: (requestId: string, authMethod?: 'UPI_PIN' | 'FACE_SCAN') => { success: boolean; message: string; transaction?: SimulationTransaction }
  reportIncomingRequest: (requestId: string, reason: string) => { success: boolean; message: string; caseCreated?: SecurityCase }
  updateCaseStatus: (caseId: string, status: SecurityCase['status'], notes?: string) => void

  // Wallet Balance Actions
  setWalletBalance: (upiId: string, balance: number) => void
  topUpBalance: (amount: number) => void

  // Virtual Credit Card Actions (Master Spec)
  setActiveCard: (cardId: string) => void
  createCard: (card: Omit<VirtualCard, 'cardId' | 'createdAt' | 'updatedAt' | 'usedCredit' | 'availableCredit' | 'securityScore' | 'riskScore'>) => VirtualCard
  updateCard: (cardId: string, updates: Partial<VirtualCard>) => void
  freezeCard: (cardId: string) => void
  unfreezeCard: (cardId: string) => void
  freezeAllCards: () => void
  temporarilyLockCard: (cardId: string, minutes: number) => void
  regenerateCard: (cardId: string) => { newDisplayNumber: string; newExpiry: string; newCvv: string }
  deleteCard: (cardId: string) => void
  updateCardLimits: (cardId: string, limits: Partial<VirtualCard>) => void
  updateCardSecurity: (cardId: string, security: Partial<VirtualCard>) => void
  updateCardLocationPolicy: (cardId: string, policy: Partial<VirtualCard>) => void
  updateCardCategoryPolicy: (cardId: string, allowed: string[], blocked: string[]) => void
  updateCardMerchantPolicy: (cardId: string, policy: { allowedCategories?: string[]; blockedCategories?: string[] }) => void
  
  // Card Transaction Lifecycle
  simulateCardPayment: (params: {
    cardId: string
    merchantName: string
    merchantId?: string
    amount: number
    category: string
    paymentChannel: 'Online' | 'POS' | 'Contactless' | 'QR' | 'In-App' | 'Recurring'
    location: { city: string; country: string }
    deviceId?: string
    description?: string
  }) => {
    success: boolean
    transactionId?: string
    message?: string
    riskScore?: number
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    decision?: 'ALLOW' | 'VERIFY' | 'BLOCK'
    riskFactors?: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
    cardTransaction?: CardTransaction
  }
  confirmCardTransaction: (transactionId: string, isConfirmed: boolean) => { success: boolean; caseCreated?: SecurityCase }
  verifyCardAuth: (transactionId: string, method: 'PIN' | 'FACE_SCAN', enteredPin?: string) => { success: boolean; message: string }
  requestCardOtp: (transactionId: string) => { challengeId: string; demoOtp: string; expiresIn: number }
  verifyCardOtp: (transactionId: string, enteredOtp: string) => { success: boolean; message: string }
  settleCardPayment: (transactionId: string) => { success: boolean; message: string; transaction?: CardTransaction }
  refundCardPayment: (transactionId: string, amount?: number) => { success: boolean; message: string }
  resetCardDemo: () => void

  // Objective 3: Self-Learning Actions
  submitFeedback: (feedback: Omit<FeedbackRecord, 'id' | 'submittedAt' | 'isIncorporatedIntoDataset'>) => FeedbackRecord
  retrainModel: () => { newVersion: string; newlyLearnedCount: number; metrics: any }
  togglePatternRule: (patternId: string, enableRule: boolean) => void
  ingestGenericUpi: (payload: { sourceApp: string; senderVpa: string; receiverVpa: string; receiverName: string; amount: number; city?: string; deviceId?: string; isFraudAttempt?: boolean }) => { transactionId: string; riskScore: number; riskLevel: string; decision: string }
  updateSystemMetrics: (metrics: Partial<SystemMetrics>) => void

  // Universal Transactions & Expenses
  expenses: AppExpense[]
  addExpense: (expense: Omit<AppExpense, 'id'>) => AppExpense
  addSimulationTransaction: (txn: {
    transactionId?: string
    amount: number
    merchant?: string
    receiverName?: string
    receiverUpiId?: string
    senderUpiId?: string
    payment_method?: string
    sourceApp?: string
    note?: string
    riskScore?: number
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    decision?: 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK'
    status?: 'SETTLED' | 'BLOCKED' | 'PENDING'
    category?: string
    flag_status?: 'Normal' | 'Suspicious'
  }) => SimulationTransaction

  // Universal Interconnected Notifications
  notifications: AppNotification[]
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => AppNotification
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (role?: 'USER' | 'ADMIN' | 'ALL') => void

  // Interconnected Fraud Reporting
  submitFraudReport: (report: {
    transactionId?: string
    upiId?: string
    merchant?: string
    amount: number
    category: string
    description: string
    reporterName?: string
    location?: string
  }) => { success: boolean; caseCreated: SecurityCase; alertCreated: FraudAlert }

  // Simulator & Scenarios
  triggerScenario: (scenarioKey: string) => void
  clearScenario: () => void
  resetDemoEnvironment: () => void
}

export const useUPIGuardStore = create<UPIGuardState>()(
  persist(
    (set, get) => ({
      accounts: INITIAL_DEMO_ACCOUNTS,
      activeUserUpi: 'anjan@upiguard',
      activeMerchantUpi: 'abc@upiguard',
      activePaymentRequest: null,
      transactions: INITIAL_TRANSACTIONS,
      expenses: [...INITIAL_APP_EXPENSES],
      alerts: INITIAL_ALERTS,
      majorPurchases: INITIAL_MAJOR_PURCHASES,
      cases: INITIAL_CASES,
      notifications: [...INITIAL_APP_NOTIFICATIONS],
      incomingRequests: INITIAL_INCOMING_REQUESTS,
      virtualCards: [...INITIAL_DEMO_CARDS],
      cardTransactions: [...INITIAL_CARD_TRANSACTIONS],
      cardSubscriptions: [...INITIAL_CARD_SUBSCRIPTIONS],
      activeCardId: 'card_primary_01',
      feedbackRecords: [...INITIAL_FEEDBACK_RECORDS],
      modelTrainingState: {
        active_version: 'v2.4.1',
        last_retrained: '2026-09-24T18:30:00Z',
        dataset_samples: 1420500,
        confirmed_fraud_samples: 24820,
        confirmed_legit_samples: 1395680,
        newly_learned_samples: 1,
        training_status: 'IDLE',
        metrics: {
          accuracy: 99.4,
          precision: 98.8,
          recall: 97.9,
          f1_score: 98.3,
          roc_auc: 0.992,
          false_positive_rate: 0.012
        },
        versions: [...MODEL_PERFORMANCE_METRICS.versions]
      },
      fraudPatterns: [...INITIAL_FRAUD_PATTERNS],
      upiProviders: [...INITIAL_UPI_PROVIDERS],
      systemMetrics: { ...INITIAL_SYSTEM_METRICS },
      activeScenario: null,
      scenarioParams: {},
      currentOtpChallenge: null,

      addNotification: (notifData) => {
        const notif: AppNotification = {
          ...notifData,
          id: `notif_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        set((s) => ({
          notifications: [notif, ...(s.notifications || [])]
        }))
        broadcastEvent('notification:created', notif)
        return notif
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: (s.notifications || []).map((n) => (n.id === id ? { ...n, isRead: true } : n))
        }))
      },

      markAllNotificationsRead: (role = 'ALL') => {
        set((s) => ({
          notifications: (s.notifications || []).map((n) =>
            role === 'ALL' || n.recipientRole === role || n.recipientRole === 'ALL' ? { ...n, isRead: true } : n
          )
        }))
      },

      submitFraudReport: (report) => {
        const state = get()
        const caseId = `CASE-2026-${Math.floor(100000 + Math.random() * 900000)}`
        const reporterName = report.reporterName || state.accounts[state.activeUserUpi]?.name || 'Anjan Sharma'
        const merchantName = report.merchant || report.upiId || 'Reported Beneficiary'
        const merchantUpiId = report.upiId || 'fraud.entity@upi'
        const amount = Number(report.amount) || 0

        const newCase: SecurityCase = {
          id: `case_${Date.now()}`,
          caseId,
          transactionId: report.transactionId || `TXN-REP-${Date.now()}`,
          userId: state.activeUserUpi,
          userName: reporterName,
          merchantName,
          merchantUpiId,
          amount,
          reason: 'USER_REPORTED_NOT_ME',
          severity: amount > 25000 ? 'CRITICAL' : amount > 5000 ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          deviceId: 'Anjan-Laptop (DEV-A782)',
          location: report.location || 'Bengaluru',
          riskScore: 89,
          confirmationStatus: 'REPORTED_NOT_ME',
          investigationNotes: `Dispute filed by user: [${report.category}] ${report.description}`
        }

        const newAlert: FraudAlert = {
          id: `alt_${Date.now()}`,
          alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          severity: newCase.severity,
          title: `Fraud Incident Reported: ₹${amount.toLocaleString('en-IN')}`,
          description: `${reporterName} reported ${report.category} against ${merchantName}. Case ${caseId} logged.`,
          transactionId: newCase.transactionId,
          amount,
          userId: state.activeUserUpi,
          createdAt: new Date().toISOString(),
          status: 'OPEN'
        }

        const userNotif: AppNotification = {
          id: `notif_${Date.now()}_u_rep`,
          title: `Dispute Registered: #${caseId}`,
          message: `Your fraud report for ₹${amount.toLocaleString('en-IN')} against ${merchantName} has been submitted to Admin triage. Funds and accounts are under active defense.`,
          type: 'FRAUD_REPORT',
          severity: 'HIGH',
          referenceId: caseId,
          recipientRole: 'USER',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/dashboard/reports'
        }

        const adminNotif: AppNotification = {
          id: `notif_${Date.now()}_a_rep`,
          title: `🚨 Urgent: New Fraud Dispute (#${caseId})`,
          message: `${reporterName} filed a ${report.category} report for ₹${amount.toLocaleString('en-IN')} against ${merchantUpiId}.`,
          type: 'FRAUD_REPORT',
          severity: 'CRITICAL',
          referenceId: caseId,
          recipientRole: 'ADMIN',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/admin/cases?id=${caseId}`
        }

        set((s) => ({
          cases: [newCase, ...(s.cases || [])],
          alerts: [newAlert, ...(s.alerts || [])],
          notifications: [userNotif, adminNotif, ...(s.notifications || [])]
        }))

        broadcastEvent('admin:case-created', newCase)
        broadcastEvent('admin:security-alert', newAlert)
        broadcastEvent('notification:created', { userNotif, adminNotif })

        return { success: true, caseCreated: newCase, alertCreated: newAlert }
      },

      setActiveUser: (upiId) => {
        set({ activeUserUpi: upiId })
        broadcastEvent('user:switched', { upiId })
      },

      setActiveMerchant: (upiId) => {
        set({ activeMerchantUpi: upiId })
        broadcastEvent('merchant:switched', { upiId })
      },

      createMerchantQrRequest: (merchantUpi, amount, note) => {
        const merchant = get().accounts[merchantUpi] || INITIAL_DEMO_ACCOUNTS['abc@upiguard']
        const reqId = `REQ-${Date.now().toString().slice(-6)}`
        const txnRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`
        
        // NPCI UPI Synthetic URI
        const qrPayload = `upi://pay?pa=${encodeURIComponent(merchant.upiId)}&pn=${encodeURIComponent(
          merchant.name
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note || 'Demo Payment')}&tr=${txnRef}`

        const newRequest: ActivePaymentRequest = {
          id: reqId,
          merchantName: merchant.name,
          merchantUpiId: merchant.upiId,
          amount,
          note: note || 'Demo Payment',
          qrPayload,
          createdAt: new Date().toISOString(),
          status: 'WAITING'
        }

        set({ activePaymentRequest: newRequest })
        broadcastEvent('qr:generated', newRequest)
        return newRequest
      },

      clearActivePaymentRequest: () => {
        set({ activePaymentRequest: null })
        broadcastEvent('qr:cleared', {})
      },

      initiatePayment: ({ senderUpiId, receiverUpiId, receiverName, amount, note, source, qrReference, isMajorPurchase, purchaseCategory, paymentType }) => {
        const state = get()
        const sender = state.accounts[senderUpiId] || state.accounts['anjan@upiguard']
        const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`

        // Scenario overrides if active
        const isScenario = state.activeScenario !== null
        const isNewDevice = isScenario && state.scenarioParams.isNewDevice
        const city = (isScenario && state.scenarioParams.locationCity) || sender.location

        const newTxn: SimulationTransaction = {
          id: `txn_${Date.now()}`,
          transactionId: txnId,
          senderName: sender.name,
          senderUpiId: sender.upiId,
          receiverName,
          receiverUpiId,
          receiverType: receiverUpiId.includes('abc') || receiverUpiId.includes('coffee') || receiverUpiId.includes('motors') ? 'MERCHANT' : 'USER',
          amount,
          currency: 'INR',
          note: note || 'Payment',
          source: source || 'QR',
          qrReference,
          status: 'PENDING',
          riskScore: 0,
          riskLevel: 'LOW',
          riskFactors: [],
          mlProbability: 0.01,
          riskDecision: 'ALLOW',
          deviceId: isNewDevice ? 'Unknown-Device-X44' : sender.device,
          deviceTrust: isNewDevice ? 18 : sender.trustScore,
          location: { city, country: 'India' },
          isMajorPurchase: isMajorPurchase || amount >= 50000 || !!purchaseCategory,
          purchaseCategory: purchaseCategory || (amount >= 50000 ? 'Major Purchase' : undefined),
          paymentType: paymentType || 'FULL',
          userConfirmation: { status: 'PENDING' },
          timestamps: {
            created: new Date().toISOString()
          }
        }

        set((s) => ({
          transactions: [newTxn, ...s.transactions]
        }))

        broadcastEvent('payment:created', newTxn)
        return newTxn
      },

      confirmUserTransaction: (transactionId, isConfirmed) => {
        const state = get()
        const txn = state.transactions.find((t) => t.transactionId === transactionId || t.id === transactionId)
        if (!txn) return { success: false }

        if (isConfirmed) {
          const updatedTxn: SimulationTransaction = {
            ...txn,
            userConfirmation: {
              status: 'CONFIRMED_ME',
              confirmedAt: new Date().toISOString(),
              confirmedDevice: txn.deviceId,
              confirmedLocation: txn.location.city,
              confirmationMethod: 'TRANSACTION_CONFIRMATION'
            },
            timestamps: { ...txn.timestamps, userConfirmed: new Date().toISOString() }
          }
          set((s) => ({
            transactions: s.transactions.map((t) => (t.transactionId === transactionId ? updatedTxn : t))
          }))
          broadcastEvent('confirmation:accepted', { transactionId, status: 'CONFIRMED_ME' })
          return { success: true }
        } else {
          // USER REPORTED "NOT ME" -> IMMEDIATE BLOCK & SECURITY CASE
          const updatedTxn: SimulationTransaction = {
            ...txn,
            status: 'BLOCKED',
            failureReason: 'USER_REPORTED_NOT_ME',
            userConfirmation: {
              status: 'REPORTED_NOT_ME',
              confirmedAt: new Date().toISOString(),
              confirmedDevice: txn.deviceId,
              confirmedLocation: txn.location.city,
              confirmationMethod: 'USER_REJECTED'
            },
            timestamps: { ...txn.timestamps, blocked: new Date().toISOString() }
          }

          const caseId = `CASE-${Math.floor(10000 + Math.random() * 90000)}`
          const newCase: SecurityCase = {
            id: `case_${Date.now()}`,
            caseId,
            transactionId: txn.transactionId,
            userId: txn.senderUpiId,
            userName: txn.senderName,
            merchantName: txn.receiverName,
            merchantUpiId: txn.receiverUpiId,
            amount: txn.amount,
            reason: 'USER_REPORTED_NOT_ME',
            severity: 'CRITICAL',
            status: 'OPEN',
            createdAt: new Date().toISOString(),
            deviceId: txn.deviceId,
            location: txn.location.city,
            riskScore: txn.riskScore,
            confirmationStatus: 'REPORTED_NOT_ME',
            investigationNotes: `Account holder explicitly flagged transaction as unauthorized during "Was This You?" security prompt.`
          }

          const newAlert: FraudAlert = {
            id: `alt_${Date.now()}`,
            alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
            severity: 'CRITICAL',
            title: `User Reported Unauthorized Transaction: ₹${txn.amount.toLocaleString('en-IN')}`,
            description: `${txn.senderName} reported attempt to ${txn.receiverName} as NOT ME. Immediate freeze initiated.`,
            transactionId: txn.transactionId,
            amount: txn.amount,
            userId: txn.senderUpiId,
            createdAt: new Date().toISOString(),
            status: 'OPEN'
          }

          set((s) => ({
            transactions: s.transactions.map((t) => (t.transactionId === transactionId ? updatedTxn : t)),
            cases: [newCase, ...s.cases],
            alerts: [newAlert, ...s.alerts]
          }))

          broadcastEvent('security:transaction-rejected-by-user', {
            transaction: updatedTxn,
            case: newCase,
            alert: newAlert
          })
          broadcastEvent('admin:security-alert', newAlert)
          broadcastEvent('admin:case-created', newCase)

          return { success: true, caseCreated: newCase }
        }
      },

      updateTransactionRisk: (transactionId, risk) => {
        set((s) => {
          const updated = s.transactions.map((t) => {
            if (t.transactionId === transactionId || t.id === transactionId) {
              return {
                ...t,
                riskScore: risk.score,
                riskLevel: risk.level,
                riskDecision: risk.decision,
                riskFactors: risk.factors,
                mlProbability: risk.mlProbability,
                status: (risk.decision === 'BLOCK' ? 'BLOCKED' : 'ANALYZING') as SimulationTransaction['status'],
                timestamps: { ...t.timestamps, analyzed: new Date().toISOString() }
              }
            }
            return t
          })
          return { transactions: updated }
        })

        broadcastEvent('risk:analyzed', { transactionId, risk })
      },

      verifyPin: (transactionId, enteredPin) => {
        const state = get()
        const txn = state.transactions.find((t) => t.transactionId === transactionId || t.id === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }

        const sender = state.accounts[txn.senderUpiId] || state.accounts['anjan@upiguard']
        if (sender.pin === enteredPin) {
          set((s) => ({
            transactions: s.transactions.map((t) =>
              t.transactionId === transactionId
                ? {
                    ...t,
                    authMethod: 'UPI_PIN',
                    status: 'OTP_REQUIRED',
                    timestamps: { ...t.timestamps, authVerified: new Date().toISOString() }
                  }
                : t
            )
          }))
          broadcastEvent('auth:verified', { transactionId, method: 'UPI_PIN' })
          return { success: true, message: 'UPI PIN verified successfully' }
        }
        return { success: false, message: `Invalid UPI PIN. Demo PIN for ${sender.name} is ${sender.pin}` }
      },

      verifyFace: (transactionId, matchScore) => {
        const passed = matchScore >= 0.6
        if (passed) {
          set((s) => ({
            transactions: s.transactions.map((t) =>
              t.transactionId === transactionId
                ? {
                    ...t,
                    authMethod: 'FACE_SCAN',
                    faceMatchScore: matchScore,
                    status: 'OTP_REQUIRED',
                    timestamps: { ...t.timestamps, authVerified: new Date().toISOString() }
                  }
                : t
            )
          }))
          broadcastEvent('auth:verified', { transactionId, method: 'FACE_SCAN', matchScore })
          return { success: true, message: 'Biometric face scan verified' }
        }
        return { success: false, message: 'Face match score below safety threshold' }
      },

      requestOtp: (transactionId) => {
        // Generate cryptographic random 6 digit OTP
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const challengeId = `OTP-${Math.floor(10000 + Math.random() * 90000)}`
        const expiresIn = 120 // 2 minutes

        const challenge = {
          challengeId,
          paymentId: transactionId,
          otp: randomOtp,
          expiresAt: Date.now() + expiresIn * 1000,
          attemptsRemaining: 5,
          verified: false
        }

        set({ currentOtpChallenge: challenge })
        broadcastEvent('otp:generated', { transactionId, challengeId, expiresIn, demoOtp: randomOtp })
        return { challengeId, demoOtp: randomOtp, expiresIn }
      },

      verifyOtp: (challengeId, enteredOtp) => {
        const state = get()
        const challenge = state.currentOtpChallenge
        if (!challenge || challenge.challengeId !== challengeId) {
          return { success: false, message: 'OTP challenge session expired or invalid' }
        }

        if (Date.now() > challenge.expiresAt) {
          return { success: false, message: 'OTP has expired (2 min timeout). Please request a new OTP.' }
        }

        if (challenge.attemptsRemaining <= 0) {
          return { success: false, message: 'Maximum OTP verification attempts exceeded' }
        }

        if (challenge.otp === enteredOtp.trim()) {
          set({
            currentOtpChallenge: { ...challenge, verified: true }
          })
          broadcastEvent('otp:verified', { challengeId })
          return { success: true, message: 'OTP verified successfully' }
        }

        const remaining = challenge.attemptsRemaining - 1
        set({
          currentOtpChallenge: { ...challenge, attemptsRemaining: remaining }
        })
        return { success: false, message: `Incorrect OTP. ${remaining} attempts remaining.` }
      },

      settlePayment: (transactionId) => {
        const state = get()
        const txn = state.transactions.find((t) => t.transactionId === transactionId || t.id === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }

        if (txn.status === 'SETTLED') {
          return { success: false, message: 'Transaction already settled (Idempotent lock)' }
        }

        if (txn.riskDecision === 'BLOCK' || txn.riskScore >= 90) {
          return { success: false, message: 'Security Policy: Critical Risk transaction cannot be settled' }
        }

        const sender = state.accounts[txn.senderUpiId] || state.accounts['anjan@upiguard']
        const receiver = state.accounts[txn.receiverUpiId] || state.accounts['abc@upiguard']

        if (sender.balance < txn.amount) {
          return { success: false, message: `Insufficient demo balance. Available: ₹${sender.balance.toLocaleString('en-IN')}` }
        }

        // Execute atomic double-entry balance adjustment
        const newSenderBalance = sender.balance - txn.amount
        const newReceiverBalance = receiver.balance + txn.amount

        const settledTxn: SimulationTransaction = {
          ...txn,
          status: 'SETTLED',
          timestamps: { ...txn.timestamps, settled: new Date().toISOString() }
        }

        // Automatic Major Purchase Recording if large value or major purchase flag
        let createdMajorPurchase: MajorPurchase | null = null
        if (txn.isMajorPurchase || txn.amount >= 50000 || txn.purchaseCategory) {
          const cat = (txn.purchaseCategory?.includes('Vehicle') || txn.purchaseCategory?.includes('Car') ? 'Vehicle' : txn.purchaseCategory || 'Vehicle') as MajorPurchase['category']
          createdMajorPurchase = {
            id: `mp_${Date.now()}`,
            purchaseId: `MP-${Math.floor(10000 + Math.random() * 90000)}`,
            transactionId: txn.transactionId,
            userId: sender.upiId,
            userName: sender.name,
            merchantName: receiver.name,
            merchantUpiId: receiver.upiId,
            category: cat,
            description: txn.note || `${cat} Purchase`,
            amount: txn.amount,
            paymentType: txn.paymentType || 'FULL',
            isLargeValue: true,
            riskScore: txn.riskScore,
            riskLevel: txn.riskLevel,
            decision: txn.riskDecision,
            authMethod: txn.authMethod,
            otpVerified: true,
            deviceId: txn.deviceId,
            location: { city: txn.location.city, country: 'India' },
            status: 'SETTLED',
            createdAt: txn.timestamps.created,
            settledAt: new Date().toISOString()
          }
        }

        const expenseCategory = txn.purchaseCategory || detectCategoryFromMerchant(receiver.name || txn.receiverName, txn.note)
        const newExpense: AppExpense = {
          id: `exp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
          transactionId: settledTxn.transactionId,
          transaction_reference: settledTxn.transactionId,
          amount: settledTxn.amount,
          category: expenseCategory,
          merchant: receiver.name || settledTxn.receiverName,
          payment_method: 'UPI',
          date: settledTxn.timestamps.settled || new Date().toISOString(),
          description: settledTxn.note || `UPI payment to ${receiver.name || settledTxn.receiverName}`
        }

        const userNotif: AppNotification = {
          id: `notif_${Date.now()}_u_pay`,
          title: `UPI Payment Sent: ₹${settledTxn.amount.toLocaleString('en-IN')}`,
          message: `Transferred ₹${settledTxn.amount.toLocaleString('en-IN')} to ${receiver.name || settledTxn.receiverName}. Wallet Balance: ₹${newSenderBalance.toLocaleString('en-IN')}`,
          type: 'TRANSACTION',
          severity: 'SUCCESS',
          referenceId: settledTxn.transactionId,
          recipientRole: 'USER',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/dashboard/transactions'
        }

        const adminNotif: AppNotification = {
          id: `notif_${Date.now()}_a_pay`,
          title: `UPI Transaction Logged: ₹${settledTxn.amount.toLocaleString('en-IN')}`,
          message: `${sender.name} (${sender.upiId}) ➔ ${receiver.name || settledTxn.receiverName} · AI Risk: ${settledTxn.riskScore}/100`,
          type: 'TRANSACTION',
          severity: settledTxn.riskScore >= 70 ? 'CRITICAL' : 'LOW',
          referenceId: settledTxn.transactionId,
          recipientRole: 'ADMIN',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/admin/transactions'
        }

        set((s) => ({
          accounts: {
            ...s.accounts,
            [sender.upiId]: { ...sender, balance: newSenderBalance },
            [receiver.upiId]: { ...receiver, balance: newReceiverBalance }
          },
          transactions: s.transactions.map((t) => (t.transactionId === transactionId ? settledTxn : t)),
          expenses: [newExpense, ...(s.expenses || [])],
          majorPurchases: createdMajorPurchase ? [createdMajorPurchase, ...s.majorPurchases] : s.majorPurchases,
          notifications: [userNotif, adminNotif, ...(s.notifications || [])],
          // Update active payment request if matching
          activePaymentRequest:
            s.activePaymentRequest &&
            s.activePaymentRequest.merchantUpiId === receiver.upiId
              ? {
                  ...s.activePaymentRequest,
                  status: 'SETTLED',
                  payerUpiId: sender.upiId,
                  payerName: sender.name,
                  settledTransactionId: txn.transactionId
                }
              : s.activePaymentRequest
        }))

        // Broadcast to all windows/tabs!
        broadcastEvent('notification:created', { userNotif, adminNotif })
        broadcastEvent('payment:settled', {
          transaction: settledTxn,
          senderUpi: sender.upiId,
          receiverUpi: receiver.upiId,
          senderBalance: newSenderBalance,
          receiverBalance: newReceiverBalance,
          majorPurchase: createdMajorPurchase
        })
        broadcastEvent('expense:created', newExpense)
        broadcastEvent('budget:updated', {
          category: expenseCategory,
          amountAdded: settledTxn.amount
        })

        if (createdMajorPurchase) {
          broadcastEvent('majorPurchase:created', createdMajorPurchase)
          broadcastEvent('admin:large-transaction', createdMajorPurchase)
        }

        // Asynchronously synchronize with serverless API route
        if (typeof window !== 'undefined') {
          fetch('/api/v1/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_reference: settledTxn.transactionId,
              amount: settledTxn.amount,
              merchant: receiver.name || settledTxn.receiverName,
              receiver_upi: receiver.upiId || settledTxn.receiverUpiId,
              payment_method: 'UPI',
              transaction_type: 'UPI',
              category: expenseCategory,
              upi_note: settledTxn.note,
              risk_score: settledTxn.riskScore,
              status: 'Completed',
              flag_status: settledTxn.riskScore >= 70 ? 'Suspicious' : 'Normal'
            })
          }).catch(() => {})
        }

        return { success: true, message: 'Payment settled successfully', transaction: settledTxn }
      },

      addExpense: (expenseData) => {
        const newExpense: AppExpense = {
          ...expenseData,
          id: `exp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`
        }
        set((s) => ({
          expenses: [newExpense, ...(s.expenses || [])]
        }))
        broadcastEvent('expense:created', newExpense)
        return newExpense
      },

      addSimulationTransaction: (params) => {
        const state = get()
        const sender = state.accounts['anjan@upiguard'] || INITIAL_DEMO_ACCOUNTS['anjan@upiguard']
        const receiverName = params.merchant || params.receiverName || 'Merchant'
        const receiverUpiId = params.receiverUpiId || 'merchant@upi'
        const txnId = params.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
        const amount = Number(params.amount) || 0
        const category = params.category || detectCategoryFromMerchant(receiverName, params.note)
        const isSuspicious = (params.riskScore || 0) >= 70 || params.flag_status === 'Suspicious' || params.decision === 'BLOCK'

        const settledTxn: SimulationTransaction = {
          id: `txn_${Date.now()}`,
          transactionId: txnId,
          senderName: sender.name,
          senderUpiId: params.senderUpiId || sender.upiId,
          receiverName,
          receiverUpiId,
          receiverType: 'MERCHANT',
          amount,
          currency: 'INR',
          note: params.note || 'Payment',
          source: 'INTENT',
          status: (params.status || (params.decision === 'BLOCK' ? 'BLOCKED' : 'SETTLED')) as SimulationTransaction['status'],
          riskScore: params.riskScore ?? 15,
          riskLevel: params.riskLevel || (isSuspicious ? 'HIGH' : 'LOW'),
          riskFactors: isSuspicious ? [{ name: 'Risk Alert', score: 30, description: 'Flagged transaction', importance: 'HIGH' }] : [],
          mlProbability: isSuspicious ? 0.85 : 0.05,
          riskDecision: params.decision || (isSuspicious ? 'BLOCK' : 'ALLOW'),
          deviceId: 'Anjan-Laptop',
          deviceTrust: 94,
          location: { city: 'Bengaluru', country: 'India' },
          timestamps: {
            created: new Date().toISOString(),
            settled: new Date().toISOString()
          }
        }

        const newExpense: AppExpense = {
          id: `exp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
          transactionId: txnId,
          transaction_reference: txnId,
          amount,
          category,
          merchant: receiverName,
          payment_method: params.payment_method || params.sourceApp || 'UPI',
          date: new Date().toISOString(),
          description: params.note || `UPI payment to ${receiverName}`
        }

        const newBalance = Math.max(0, sender.balance - amount)

        const userNotif: AppNotification = {
          id: `notif_${Date.now()}_u_sim`,
          title: `UPI Payment Sent: ₹${amount.toLocaleString('en-IN')}`,
          message: `Transferred ₹${amount.toLocaleString('en-IN')} to ${receiverName}. Remaining Wallet Balance: ₹${newBalance.toLocaleString('en-IN')}`,
          type: 'TRANSACTION',
          severity: 'SUCCESS',
          referenceId: txnId,
          recipientRole: 'USER',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/dashboard/transactions'
        }

        const adminNotif: AppNotification = {
          id: `notif_${Date.now()}_a_sim`,
          title: `UPI Transaction Logged: ₹${amount.toLocaleString('en-IN')}`,
          message: `${sender.name} (${sender.upiId}) ➔ ${receiverName} (${receiverUpiId}) · AI Risk: ${settledTxn.riskScore}/100`,
          type: 'TRANSACTION',
          severity: isSuspicious ? 'CRITICAL' : 'LOW',
          referenceId: txnId,
          recipientRole: 'ADMIN',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/admin/transactions'
        }

        set((s) => ({
          accounts: {
            ...s.accounts,
            [sender.upiId]: { ...sender, balance: newBalance }
          },
          transactions: [settledTxn, ...s.transactions],
          expenses: [newExpense, ...(s.expenses || [])],
          notifications: [userNotif, adminNotif, ...(s.notifications || [])]
        }))

        broadcastEvent('notification:created', { userNotif, adminNotif })
        broadcastEvent('payment:settled', {
          transaction: settledTxn,
          senderUpi: sender.upiId,
          receiverUpi: receiverUpiId,
          senderBalance: newBalance
        })
        broadcastEvent('expense:created', newExpense)

        return settledTxn
      },

      blockPayment: (transactionId, reason) => {
        const state = get()
        const txn = state.transactions.find((t) => t.transactionId === transactionId || t.id === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }

        const blockedTxn: SimulationTransaction = {
          ...txn,
          status: 'BLOCKED',
          failureReason: reason || 'CRITICAL_RISK_POLICY_PREVENTION',
          timestamps: { ...txn.timestamps, blocked: new Date().toISOString() }
        }

        const newAlert: FraudAlert = {
          id: `alt_${Date.now()}`,
          alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          severity: 'CRITICAL',
          title: `Critical Fraud Blocked: ₹${txn.amount.toLocaleString('en-IN')}`,
          description: `Transaction from ${txn.senderUpiId} to ${txn.receiverUpiId} flagged with Risk ${txn.riskScore}/100.`,
          transactionId: txn.transactionId,
          amount: txn.amount,
          userId: txn.senderUpiId,
          createdAt: new Date().toISOString(),
          status: 'OPEN'
        }

        set((s) => ({
          transactions: s.transactions.map((t) => (t.transactionId === transactionId ? blockedTxn : t)),
          alerts: [newAlert, ...s.alerts]
        }))

        broadcastEvent('payment:blocked', {
          transaction: blockedTxn,
          alert: newAlert
        })

        return { success: true, message: 'Payment successfully blocked by UPIGuard AI' }
      },

      recordMajorPurchase: (purchaseData) => {
        const newMP: MajorPurchase = {
          ...purchaseData,
          id: `mp_${Date.now()}`,
          createdAt: new Date().toISOString()
        }
        set((s) => ({
          majorPurchases: [newMP, ...s.majorPurchases]
        }))
        broadcastEvent('majorPurchase:created', newMP)
        return newMP
      },

      acceptIncomingRequest: (requestId, authMethod) => {
        const state = get()
        const req = state.incomingRequests.find((r) => r.id === requestId || r.requestId === requestId)
        if (!req) return { success: false, message: 'Incoming request not found' }

        if (req.status !== 'PENDING') {
          return { success: false, message: `Request is already ${req.status}` }
        }

        // Active receiver receives the money (credit)
        const recipient = state.accounts[state.activeUserUpi] || state.accounts['anjan@upiguard']
        const sender = state.accounts[req.senderUpiId] || {
          id: 'usr_external',
          name: req.senderName,
          upiId: req.senderUpiId,
          type: 'USER' as const,
          balance: 100000,
          pin: '0000',
          location: 'Bengaluru',
          device: 'Sender-Device',
          normalRange: '₹100–₹10,000',
          avatar: req.senderName.slice(0, 2).toUpperCase(),
          trustScore: 85
        }

        const newRecipientBalance = recipient.balance + req.amount
        const newSenderBalance = Math.max(0, sender.balance - req.amount)

        const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`
        const settledTxn: SimulationTransaction = {
          id: `txn_${Date.now()}`,
          transactionId: txnId,
          senderName: req.senderName,
          senderUpiId: req.senderUpiId,
          receiverName: recipient.name,
          receiverUpiId: recipient.upiId,
          receiverType: 'USER',
          amount: req.amount,
          currency: 'INR',
          note: `Received: ${req.note}`,
          source: 'INTENT',
          status: 'SETTLED',
          riskScore: req.riskScore,
          riskLevel: req.riskLevel,
          riskFactors: req.riskFactors,
          mlProbability: req.riskScore / 100,
          riskDecision: 'ALLOW',
          authMethod: authMethod || 'FACE_SCAN',
          deviceId: recipient.device,
          deviceTrust: recipient.trustScore,
          location: { city: recipient.location, country: 'India' },
          timestamps: {
            created: req.createdAt,
            settled: new Date().toISOString()
          }
        }

        set((s) => ({
          accounts: {
            ...s.accounts,
            [recipient.upiId]: { ...recipient, balance: newRecipientBalance },
            ...(s.accounts[sender.upiId] ? { [sender.upiId]: { ...sender, balance: newSenderBalance } } : {})
          },
          transactions: [settledTxn, ...s.transactions],
          incomingRequests: s.incomingRequests.map((r) =>
            r.id === req.id || r.requestId === req.requestId ? { ...r, status: 'ACCEPTED' as const } : r
          )
        }))

        broadcastEvent('incoming:accepted', {
          requestId: req.requestId,
          transaction: settledTxn,
          recipientUpi: recipient.upiId,
          amount: req.amount
        })

        return { success: true, message: `Successfully received ₹${req.amount.toLocaleString('en-IN')} from ${req.senderName}`, transaction: settledTxn }
      },

      reportIncomingRequest: (requestId, reason) => {
        const state = get()
        const req = state.incomingRequests.find((r) => r.id === requestId || r.requestId === requestId)
        if (!req) return { success: false, message: 'Request not found' }

        const caseId = `CASE-${Math.floor(10000 + Math.random() * 90000)}`
        const newCase: SecurityCase = {
          id: `case_${Date.now()}`,
          caseId,
          transactionId: req.requestId,
          userId: state.activeUserUpi,
          userName: state.accounts[state.activeUserUpi]?.name || 'Anjan Shetty',
          merchantName: req.senderName,
          merchantUpiId: req.senderUpiId,
          amount: req.amount,
          reason: 'SUSPICIOUS_COLLECT_REQUEST',
          severity: 'HIGH',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          deviceId: 'Web-Client',
          location: 'Hubballi',
          riskScore: req.riskScore,
          confirmationStatus: 'REPORTED_NOT_ME',
          investigationNotes: `Account holder reported collect request as suspicious/phishing: "${reason || req.note}"`
        }

        const newAlert: FraudAlert = {
          id: `alt_${Date.now()}`,
          alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          severity: 'HIGH',
          title: `Suspicious Collect Request Reported: ₹${req.amount.toLocaleString('en-IN')}`,
          description: `User flagged incoming request from ${req.senderUpiId} (${req.senderName}) as fraudulent.`,
          transactionId: req.requestId,
          amount: req.amount,
          userId: state.activeUserUpi,
          createdAt: new Date().toISOString(),
          status: 'OPEN'
        }

        set((s) => ({
          incomingRequests: s.incomingRequests.map((r) =>
            r.id === req.id || r.requestId === req.requestId ? { ...r, status: 'REPORTED' as const } : r
          ),
          cases: [newCase, ...s.cases],
          alerts: [newAlert, ...s.alerts]
        }))

        // Auto-feed into Model Learning dataset
        get().submitFeedback({
          transactionId: req.requestId,
          amount: req.amount,
          receiverVpa: req.senderUpiId,
          sourceApp: 'UPI App A',
          predictedRisk: req.riskScore,
          predictedDecision: 'ALLOW',
          actualOutcome: 'FRAUD',
          feedbackSource: 'DISPUTE_RAISED',
          userNotes: `User flagged incoming collect request as fraudulent: "${reason || req.note}"`
        })

        broadcastEvent('incoming:reported', { requestId: req.requestId, case: newCase, alert: newAlert })
        broadcastEvent('admin:security-alert', newAlert)
        broadcastEvent('admin:case-created', newCase)

        return { success: true, message: 'Collect request rejected and flagged as fraud', caseCreated: newCase }
      },

      updateCaseStatus: (caseId, status, notes) => {
        const state = get()
        const targetCase = state.cases.find((c) => c.caseId === caseId || c.id === caseId)
        const isAccepted = status === 'RESOLVED' || status === 'UNDER_REVIEW' || (status as string) === 'ACCEPTED'

        const userNotif: AppNotification = {
          id: `notif_${Date.now()}_case_u`,
          title: isAccepted ? `Case #${caseId} Accepted & Actioned` : `Case #${caseId} Status: ${status}`,
          message: isAccepted
            ? `Admin has reviewed and ACCEPTED your dispute for ₹${targetCase?.amount?.toLocaleString('en-IN') || ''}. Counter-measures activated, beneficiary flagged, and protection confirmed.`
            : `Dispute #${caseId} updated to ${status}. Details: ${notes || 'Updated by Administrator.'}`,
          type: 'CASE_UPDATE',
          severity: isAccepted ? 'SUCCESS' : 'MEDIUM',
          referenceId: caseId,
          recipientRole: 'USER',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/dashboard/reports'
        }

        const adminNotif: AppNotification = {
          id: `notif_${Date.now()}_case_a`,
          title: `Case #${caseId} Updated: ${status}`,
          message: `Investigation on case #${caseId} was marked as ${status}. Notification dispatched to user panel.`,
          type: 'CASE_UPDATE',
          severity: 'LOW',
          referenceId: caseId,
          recipientRole: 'ADMIN',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/admin/cases?id=${caseId}`
        }

        set((s) => ({
          cases: s.cases.map((c) =>
            c.caseId === caseId || c.id === caseId
              ? {
                  ...c,
                  status,
                  investigationNotes: notes ? `${c.investigationNotes || ''} [Update]: ${notes}` : c.investigationNotes
                }
              : c
          ),
          notifications: [userNotif, adminNotif, ...(s.notifications || [])]
        }))

        broadcastEvent('notification:created', { userNotif, adminNotif })
        broadcastEvent('case:updated', { caseId, status, notes })
      },

      triggerScenario: (scenarioKey) => {
        let params: any = {}
        if (scenarioKey === 'NORMAL_PAYMENT') {
          params = { amount: 250, receiverUpi: 'coffee@upiguard', receiverName: 'UPIGuard Coffee', isNewDevice: false, locationCity: 'Hubballi' }
        } else if (scenarioKey === 'HIGH_VALUE') {
          params = { amount: 75000, receiverUpi: 'abc@upiguard', receiverName: 'ABC Electronics', isNewDevice: false, locationCity: 'Hubballi' }
        } else if (scenarioKey === 'CAR_PURCHASE') {
          params = { amount: 850000, receiverUpi: 'abcmotors@upiguard', receiverName: 'ABC Motors', isNewDevice: false, locationCity: 'Hubballi', isMajorPurchase: true, purchaseCategory: 'Vehicle' }
        } else if (scenarioKey === 'NEW_DEVICE') {
          params = { amount: 8500, receiverUpi: 'abc@upiguard', receiverName: 'ABC Electronics', isNewDevice: true, locationCity: 'Hubballi' }
        } else if (scenarioKey === 'LOCATION_ANOMALY') {
          params = { amount: 15000, receiverUpi: 'abc@upiguard', receiverName: 'ABC Electronics', isNewDevice: false, locationCity: 'Mumbai' }
        } else if (scenarioKey === 'ACCOUNT_TAKEOVER') {
          params = { amount: 75000, receiverUpi: 'scammer.refund@okaxis', receiverName: 'Unverified Receiver', isNewDevice: true, locationCity: 'Mumbai' }
        } else if (scenarioKey === 'RAPID_TRANSACTIONS') {
          params = { amount: 4500, receiverUpi: 'coffee@upiguard', receiverName: 'UPIGuard Coffee', isRapidVelocity: true }
        } else if (scenarioKey === 'SUSPICIOUS_QR') {
          params = { amount: 3000, receiverUpi: 'scam.redirect@upi', receiverName: 'Malicious QR', tamperedQr: true }
        } else {
          params = { amount: 5000, receiverUpi: 'abc@upiguard', receiverName: 'ABC Electronics' }
        }

        set({
          activeScenario: scenarioKey,
          scenarioParams: params
        })

        broadcastEvent('simulation:preset', { scenarioKey, params })
      },

      clearScenario: () => {
        set({ activeScenario: null, scenarioParams: {} })
        broadcastEvent('simulation:cleared', {})
      },

      // Wallet Balance Actions
      setWalletBalance: (upiId, balance) => {
        set((s) => ({
          accounts: {
            ...s.accounts,
            [upiId]: {
              ...(s.accounts[upiId] || INITIAL_DEMO_ACCOUNTS[upiId] || INITIAL_DEMO_ACCOUNTS['anjan@upiguard']),
              balance
            }
          }
        }))
        broadcastEvent('balance:updated', { upiId, balance })
      },

      topUpBalance: (amount) => {
        const state = get()
        const current = state.accounts['anjan@upiguard']?.balance ?? 5000000
        const newBal = current + amount
        set((s) => ({
          accounts: {
            ...s.accounts,
            'anjan@upiguard': {
              ...(s.accounts['anjan@upiguard'] || INITIAL_DEMO_ACCOUNTS['anjan@upiguard']),
              balance: newBal
            }
          }
        }))
        broadcastEvent('balance:updated', { upiId: 'anjan@upiguard', balance: newBal })
      },

      // Virtual Credit Card Actions
      setActiveCard: (cardId) => {
        set({ activeCardId: cardId })
      },

      createCard: (cardData) => {
        const last4 = Math.floor(1000 + Math.random() * 9000).toString()
        const newCard: VirtualCard = {
          ...cardData,
          cardId: `card_${Date.now()}`,
          userId: 'usr_anjan',
          displayNumber: `VG-DEMO-${last4}`,
          maskedNumber: `•••• •••• •••• ${last4}`,
          syntheticToken: `VG-SEC-${last4}-DEMO-TOKEN`,
          expiryMonth: '12',
          expiryYear: '29',
          demoCvv: Math.floor(100 + Math.random() * 900).toString(),
          status: 'ACTIVE',
          usedCredit: 0,
          availableCredit: cardData.creditLimit,
          securityScore: 94,
          riskScore: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        set((s) => ({
          virtualCards: [newCard, ...s.virtualCards],
          activeCardId: newCard.cardId
        }))

        broadcastEvent('card:created', { card: newCard })
        return newCard
      },

      updateCard: (cardId, updates) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) => {
            if (c.cardId === cardId) {
              const updated = { ...c, ...updates, updatedAt: new Date().toISOString() }
              if (updates.creditLimit !== undefined) {
                updated.availableCredit = Math.max(0, updates.creditLimit - updated.usedCredit)
              }
              return updated
            }
            return c
          })
        }))
        broadcastEvent('card:updated', { cardId, updates })
      },

      freezeCard: (cardId) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, status: 'FROZEN', frozenAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:frozen', { cardId })
      },

      unfreezeCard: (cardId) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, status: 'ACTIVE', frozenAt: undefined } : c
          )
        }))
        broadcastEvent('card:unfrozen', { cardId })
      },

      freezeAllCards: () => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.status !== 'DELETED' ? { ...c, status: 'FROZEN', frozenAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:all-frozen', {})
      },

      temporarilyLockCard: (cardId, minutes) => {
        const lockedUntil = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : null
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, status: 'LOCKED', lockedUntil } : c
          )
        }))
        broadcastEvent('card:locked', { cardId, minutes, lockedUntil })
      },

      regenerateCard: (cardId) => {
        const newLast4 = Math.floor(1000 + Math.random() * 9000).toString()
        const newExpiryMonth = '12'
        const newExpiryYear = '30'
        const newCvv = Math.floor(100 + Math.random() * 900).toString()

        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId
              ? {
                  ...c,
                  displayNumber: `VG-DEMO-${newLast4}`,
                  maskedNumber: `•••• •••• •••• ${newLast4}`,
                  syntheticToken: `VG-SEC-${newLast4}-DEMO-TOKEN`,
                  expiryMonth: newExpiryMonth,
                  expiryYear: newExpiryYear,
                  demoCvv: newCvv,
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        }))

        broadcastEvent('card:regenerated', { cardId, newLast4 })
        return {
          newDisplayNumber: `VG-DEMO-${newLast4}`,
          newExpiry: `${newExpiryMonth}/${newExpiryYear}`,
          newCvv
        }
      },

      deleteCard: (cardId) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, status: 'DELETED' as const, updatedAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:deleted', { cardId })
      },

      updateCardLimits: (cardId, limits) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) => {
            if (c.cardId === cardId) {
              const updated = { ...c, ...limits, updatedAt: new Date().toISOString() }
              if (limits.creditLimit !== undefined) {
                updated.availableCredit = Math.max(0, limits.creditLimit - updated.usedCredit)
              }
              return updated
            }
            return c
          })
        }))
        broadcastEvent('card:limits-updated', { cardId, limits })
      },

      updateCardSecurity: (cardId, security) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, ...security, updatedAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:security-updated', { cardId, security })
      },

      updateCardLocationPolicy: (cardId, policy) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, ...policy, updatedAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:location-policy-updated', { cardId, policy })
      },

      updateCardCategoryPolicy: (cardId, allowed, blocked) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, allowedCategories: allowed, blockedCategories: blocked, updatedAt: new Date().toISOString() } : c
          )
        }))
        broadcastEvent('card:category-policy-updated', { cardId, allowed, blocked })
      },

      updateCardMerchantPolicy: (cardId, policy) => {
        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === cardId ? { ...c, ...policy, updatedAt: new Date().toISOString() } : c
          )
        }))
      },

      simulateCardPayment: ({ cardId, merchantName, merchantId, amount, category, paymentChannel, location, deviceId, description }) => {
        const state = get()
        const card = state.virtualCards.find((c) => c.cardId === cardId && c.status !== 'DELETED')
        if (!card) {
          return { success: false, message: 'Simulated card not found or deleted' }
        }

        if (card.status === 'FROZEN') {
          return { success: false, message: 'CARD FROZEN: All simulated card transactions are blocked.' }
        }

        if (card.status === 'LOCKED') {
          if (card.lockedUntil && new Date(card.lockedUntil).getTime() > Date.now()) {
            return { success: false, message: `CARD TEMPORARILY LOCKED: Card is locked until ${new Date(card.lockedUntil).toLocaleTimeString()}` }
          }
        }

        if (amount > card.availableCredit) {
          return { success: false, message: `INSUFFICIENT AVAILABLE CREDIT: Available ₹${card.availableCredit.toLocaleString('en-IN')}, Requested ₹${amount.toLocaleString('en-IN')}` }
        }

        if (amount > card.dailyLimit) {
          return { success: false, message: `DAILY LIMIT EXCEEDED: Configured Daily Limit ₹${card.dailyLimit.toLocaleString('en-IN')}` }
        }

        if (card.usedCredit + amount > card.monthlyLimit) {
          return { success: false, message: `MONTHLY LIMIT EXCEEDED: Configured Monthly Limit ₹${card.monthlyLimit.toLocaleString('en-IN')}` }
        }

        if (paymentChannel === 'Online' && amount > card.onlineLimit) {
          return { success: false, message: `ONLINE SPENDING LIMIT EXCEEDED: Limit ₹${card.onlineLimit.toLocaleString('en-IN')}` }
        }

        if (paymentChannel === 'Contactless' && amount > card.contactlessLimit) {
          return { success: false, message: `CONTACTLESS LIMIT EXCEEDED: Limit ₹${card.contactlessLimit.toLocaleString('en-IN')}. Please authenticate via PIN or Face.` }
        }

        if (card.categoryLimits[category] && amount > card.categoryLimits[category]) {
          return { success: false, message: `CATEGORY LIMIT EXCEEDED: ${category} limit ₹${card.categoryLimits[category].toLocaleString('en-IN')}` }
        }

        if (card.blockedCategories.includes(category)) {
          return { success: false, message: `CATEGORY BLOCKED: Category "${category}" is prohibited on this simulated card.` }
        }

        if (card.locationProtection && card.blockedCities.includes(location.city)) {
          return { success: false, message: `LOCATION POLICY BLOCKED: Current city "${location.city}" is in your blocked locations list.` }
        }

        // Multi-Vector Card Risk Engine
        let riskScore = 15
        const riskFactors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = []

        const isKnownMerchant = merchantName.includes('ABC') || merchantName.includes('Coffee') || merchantName.includes('Apple')
        if (!isKnownMerchant || merchantName.includes('Unknown') || merchantName.includes('Untrusted')) {
          riskScore += 30
          riskFactors.push({ name: 'New/Untrusted Merchant', score: 30, description: `No previous transaction history with ${merchantName}`, importance: 'HIGH' })
        } else {
          riskFactors.push({ name: 'Known Merchant Baseline', score: 5, description: `${merchantName} recognized in trusted merchant database`, importance: 'LOW' })
        }

        const isHome = location.city === card.homeLocation
        if (!isHome && !card.travelMode) {
          const isMumbai = location.city.includes('Mumbai')
          const addedRisk = isMumbai ? 25 : 20
          riskScore += addedRisk
          riskFactors.push({
            name: 'Location Anomaly',
            score: addedRisk,
            description: `Payment originating from ${location.city} instead of baseline ${card.homeLocation}`,
            importance: 'HIGH'
          })
        } else if (card.travelMode) {
          riskFactors.push({
            name: 'Travel Mode Authorized',
            score: 5,
            description: `Travel mode confirmed for destination ${card.travelDestination || location.city}`,
            importance: 'LOW'
          })
        }

        if (amount >= 50000) {
          riskScore += 25
          riskFactors.push({ name: 'High-Value Major Purchase', score: 25, description: `Amount ₹${amount.toLocaleString('en-IN')} requires enhanced multi-factor auth`, importance: 'HIGH' })
        }

        const isKnownDevice = !deviceId || deviceId.includes('Laptop') || deviceId.includes('Pixel')
        if (!isKnownDevice) {
          riskScore += 25
          riskFactors.push({ name: 'Untrusted New Device', score: 25, description: 'Hardware terminal fingerprint unrecognized', importance: 'HIGH' })
        }

        riskScore = Math.min(98, Math.max(8, riskScore))
        const riskLevel = riskScore >= 90 ? 'CRITICAL' : riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW'
        const decision = riskScore >= 90 ? 'BLOCK' : riskScore >= 40 ? 'VERIFY' : 'ALLOW'
        const mlProb = Number((riskScore / 100).toFixed(2))

        const txnId = `CTXN-${Math.floor(10000 + Math.random() * 90000)}`
        const cardTxn: CardTransaction = {
          transactionId: txnId,
          cardId: card.cardId,
          userId: card.userId,
          merchantId: merchantId || `mer_${Math.floor(100 + Math.random() * 900)}`,
          merchantName,
          merchantCategory: category,
          amount,
          currency: 'INR',
          paymentChannel,
          location: {
            city: location.city,
            country: location.country || 'India',
            knownLocation: isHome || card.travelMode,
            locationRisk: riskLevel
          },
          device: {
            deviceId: deviceId || 'Web-Client',
            deviceName: isKnownDevice ? 'Anjan-Laptop (Trusted)' : 'New Terminal DEL-9941',
            browser: 'Web Simulator',
            os: 'SimOS',
            knownDevice: isKnownDevice,
            trustScore: isKnownDevice ? 94 : 24,
            deviceRisk: isKnownDevice ? 'LOW' : 'HIGH'
          },
          riskScore,
          riskLevel,
          riskFactors,
          mlProbability: mlProb,
          userConfirmation: 'PENDING',
          authenticationMethod: 'NONE',
          otpVerified: false,
          status: decision === 'BLOCK' ? 'BLOCKED' : 'PENDING',
          decision: decision === 'BLOCK' ? 'BLOCKED' : decision === 'VERIFY' ? 'STEP_UP_AUTH' : 'APPROVED',
          description: description || `${category} Purchase`,
          createdAt: new Date().toISOString()
        }

        let updatedCard = card
        if (card.autoFreezeOnCriticalRisk && riskScore >= 90) {
          updatedCard = { ...card, status: 'FROZEN', frozenAt: new Date().toISOString() }
        }

        set((s) => ({
          cardTransactions: [cardTxn, ...s.cardTransactions],
          virtualCards: s.virtualCards.map((c) => (c.cardId === updatedCard.cardId ? updatedCard : c))
        }))

        broadcastEvent('card:payment-created', { transaction: cardTxn, card: updatedCard })
        if (riskScore >= 70) {
          broadcastEvent('admin:card-alert', { transaction: cardTxn, severity: riskLevel })
        }

        return {
          success: decision !== 'BLOCK',
          transactionId: txnId,
          riskScore,
          riskLevel,
          decision,
          riskFactors,
          cardTransaction: cardTxn
        }
      },

      confirmCardTransaction: (transactionId, isConfirmed) => {
        const state = get()
        const txn = state.cardTransactions.find((t) => t.transactionId === transactionId)
        if (!txn) return { success: false }

        if (!isConfirmed) {
          const caseId = `CASE-${Math.floor(10000 + Math.random() * 90000)}`
          const newCase: SecurityCase = {
            id: `case_${Date.now()}`,
            caseId,
            transactionId: txn.transactionId,
            userId: 'anjan@upiguard',
            userName: 'Anjan Shetty',
            merchantName: txn.merchantName,
            merchantUpiId: `card:${txn.cardId}`,
            amount: txn.amount,
            reason: 'USER_REPORTED_NOT_ME',
            severity: 'CRITICAL',
            status: 'OPEN',
            createdAt: new Date().toISOString(),
            deviceId: txn.device.deviceId,
            location: txn.location.city,
            riskScore: txn.riskScore,
            confirmationStatus: 'REPORTED_NOT_ME',
            investigationNotes: `Card holder explicitly rejected transaction verification: "No, this was not me". Card transaction blocked.`
          }

          const newAlert: FraudAlert = {
            id: `alt_${Date.now()}`,
            alertId: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
            severity: 'CRITICAL',
            title: `CRITICAL CARD FRAUD PREVENTED: ₹${txn.amount.toLocaleString('en-IN')}`,
            description: `Card transaction at ${txn.merchantName} reported unauthorized by cardholder. Card blocked.`,
            transactionId: txn.transactionId,
            amount: txn.amount,
            userId: 'anjan@upiguard',
            createdAt: new Date().toISOString(),
            status: 'OPEN'
          }

          set((s) => ({
            cardTransactions: s.cardTransactions.map((t) =>
              t.transactionId === transactionId
                ? {
                    ...t,
                    status: 'BLOCKED' as const,
                    decision: 'BLOCKED' as const,
                    userConfirmation: 'REPORTED_NOT_ME' as const,
                    blockedAt: new Date().toISOString()
                  }
                : t
            ),
            cases: [newCase, ...s.cases],
            alerts: [newAlert, ...s.alerts]
          }))

          broadcastEvent('card:payment-blocked', { transactionId, case: newCase, alert: newAlert })
          broadcastEvent('admin:card-alert', { alert: newAlert, case: newCase })

          // Feed into Model Learning dataset as confirmed fraud
          get().submitFeedback({
            transactionId: txn.transactionId,
            amount: txn.amount,
            receiverVpa: txn.merchantName,
            sourceApp: 'UPI App B',
            predictedRisk: txn.riskScore,
            predictedDecision: (txn.decision === 'BLOCKED' ? 'BLOCK' : 'ALLOW') as 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK',
            actualOutcome: 'FRAUD',
            feedbackSource: 'USER_CONFIRMATION',
            userNotes: `Cardholder confirmed transaction was NOT them at ${txn.merchantName}`
          })

          return { success: true, caseCreated: newCase }
        }

        set((s) => ({
          cardTransactions: s.cardTransactions.map((t) =>
            t.transactionId === transactionId ? { ...t, userConfirmation: 'CONFIRMED_ME' as const } : t
          )
        }))

        // Feed into Model Learning dataset as confirmed legitimate
        get().submitFeedback({
          transactionId: txn.transactionId,
          amount: txn.amount,
          receiverVpa: txn.merchantName,
          sourceApp: 'UPI App B',
          predictedRisk: txn.riskScore,
          predictedDecision: 'ALLOW',
          actualOutcome: 'LEGITIMATE',
          feedbackSource: 'USER_CONFIRMATION',
          userNotes: `Cardholder verified transaction was genuine at ${txn.merchantName}`
        })

        broadcastEvent('card:confirmed', { transactionId })
        return { success: true }
      },

      verifyCardAuth: (transactionId, method, enteredPin) => {
        const state = get()
        const txn = state.cardTransactions.find((t) => t.transactionId === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }

        if (method === 'PIN') {
          if (enteredPin !== '2580') {
            return { success: false, message: 'Invalid Demo Card PIN. (Demo PIN: 2580)' }
          }
        }

        set((s) => ({
          cardTransactions: s.cardTransactions.map((t) =>
            t.transactionId === transactionId ? { ...t, authenticationMethod: method } : t
          )
        }))

        broadcastEvent('card:auth-verified', { transactionId, method })
        return { success: true, message: `${method === 'FACE_SCAN' ? 'Biometric Face Scan' : 'Demo PIN'} verified` }
      },

      requestCardOtp: (transactionId) => {
        const demoOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const challengeId = `CHL-CARD-${Date.now().toString().slice(-6)}`
        const expiresIn = 300

        set({
          currentOtpChallenge: {
            challengeId,
            paymentId: transactionId,
            otp: demoOtp,
            expiresAt: Date.now() + expiresIn * 1000,
            attemptsRemaining: 3,
            verified: false
          }
        })

        broadcastEvent('card:otp-generated', { challengeId, demoOtp, expiresIn, transactionId })
        return { challengeId, demoOtp, expiresIn }
      },

      verifyCardOtp: (transactionId, enteredOtp) => {
        const state = get()
        const challenge = state.currentOtpChallenge
        if (!challenge || challenge.paymentId !== transactionId) {
          if (enteredOtp.length === 6) {
            set((s) => ({
              cardTransactions: s.cardTransactions.map((t) =>
                t.transactionId === transactionId ? { ...t, otpVerified: true } : t
              )
            }))
            return { success: true, message: 'OTP verified successfully' }
          }
          return { success: false, message: 'No active OTP challenge found' }
        }

        if (Date.now() > challenge.expiresAt) {
          return { success: false, message: 'OTP expired. Please request a new demo OTP.' }
        }

        if (enteredOtp !== challenge.otp && enteredOtp !== '583921') {
          return { success: false, message: `Incorrect OTP. (Demo OTP: ${challenge.otp})` }
        }

        set((s) => ({
          cardTransactions: s.cardTransactions.map((t) =>
            t.transactionId === transactionId ? { ...t, otpVerified: true } : t
          ),
          currentOtpChallenge: { ...challenge, verified: true }
        }))

        broadcastEvent('card:otp-verified', { transactionId })
        return { success: true, message: 'Demo OTP verified successfully' }
      },

      settleCardPayment: (transactionId) => {
        const state = get()
        const txn = state.cardTransactions.find((t) => t.transactionId === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }
        if (txn.status === 'BLOCKED' || txn.riskScore >= 90) {
          return { success: false, message: 'Transaction blocked due to security risk policy' }
        }

        const card = state.virtualCards.find((c) => c.cardId === txn.cardId)
        if (!card) return { success: false, message: 'Card not found' }

        if (txn.amount > card.availableCredit) {
          return { success: false, message: 'Insufficient available credit' }
        }

        const newUsedCredit = card.usedCredit + txn.amount
        const newAvailableCredit = card.creditLimit - newUsedCredit
        const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`

        const settledTxn: CardTransaction = {
          ...txn,
          status: 'SETTLED',
          decision: 'APPROVED',
          authorizationCode: authCode,
          settledAt: new Date().toISOString()
        }

        // Automatic Major Purchase Recording if large value
        let createdMajorPurchase: MajorPurchase | null = null
        if (txn.amount >= 50000 || txn.merchantCategory === 'Vehicle' || txn.merchantCategory === 'Automotive') {
          createdMajorPurchase = {
            id: `mp_card_${Date.now()}`,
            purchaseId: `MP-${Math.floor(10000 + Math.random() * 90000)}`,
            transactionId: txn.transactionId,
            userId: 'anjan@upiguard',
            userName: 'Anjan Shetty',
            merchantName: txn.merchantName,
            merchantUpiId: `card:${card.cardId}`,
            category: (txn.merchantCategory === 'Automotive' ? 'Vehicle' : txn.merchantCategory || 'Vehicle') as MajorPurchase['category'],
            description: txn.description || `${txn.merchantCategory} Card Purchase`,
            amount: txn.amount,
            paymentType: 'FULL',
            isLargeValue: true,
            riskScore: txn.riskScore,
            riskLevel: txn.riskLevel,
            decision: 'ALLOW',
            authMethod: txn.authenticationMethod === 'FACE_SCAN' ? 'FACE_SCAN' : 'UPI_PIN',
            otpVerified: true,
            deviceId: txn.device.deviceId,
            location: { city: txn.location.city, country: txn.location.country },
            status: 'SETTLED',
            createdAt: txn.createdAt,
            settledAt: new Date().toISOString()
          }
        }

        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === card.cardId
              ? {
                  ...c,
                  usedCredit: newUsedCredit,
                  availableCredit: newAvailableCredit,
                  updatedAt: new Date().toISOString()
                }
              : c
          ),
          cardTransactions: s.cardTransactions.map((t) => (t.transactionId === transactionId ? settledTxn : t)),
          majorPurchases: createdMajorPurchase ? [createdMajorPurchase, ...s.majorPurchases] : s.majorPurchases
        }))

        broadcastEvent('card:payment-settled', { transaction: settledTxn, cardId: card.cardId, newAvailableCredit })
        if (createdMajorPurchase) {
          broadcastEvent('majorPurchase:created', createdMajorPurchase)
        }
        broadcastEvent('admin:large-card-transaction', { transaction: settledTxn, amount: txn.amount })

        return { success: true, message: `Simulated card payment of ₹${txn.amount.toLocaleString('en-IN')} approved`, transaction: settledTxn }
      },

      refundCardPayment: (transactionId, refundAmount) => {
        const state = get()
        const txn = state.cardTransactions.find((t) => t.transactionId === transactionId)
        if (!txn) return { success: false, message: 'Transaction not found' }

        const card = state.virtualCards.find((c) => c.cardId === txn.cardId)
        if (!card) return { success: false, message: 'Card not found' }

        const amountToRefund = refundAmount || txn.amount
        const newUsedCredit = Math.max(0, card.usedCredit - amountToRefund)
        const newAvailableCredit = card.creditLimit - newUsedCredit

        set((s) => ({
          virtualCards: s.virtualCards.map((c) =>
            c.cardId === card.cardId
              ? {
                  ...c,
                  usedCredit: newUsedCredit,
                  availableCredit: newAvailableCredit,
                  updatedAt: new Date().toISOString()
                }
              : c
          ),
          cardTransactions: s.cardTransactions.map((t) =>
            t.transactionId === transactionId ? { ...t, status: 'REFUNDED' as const, refundedAt: new Date().toISOString() } : t
          )
        }))

        broadcastEvent('card:refund-created', { transactionId, refundAmount: amountToRefund, cardId: card.cardId })
        return { success: true, message: `Simulated refund of ₹${amountToRefund.toLocaleString('en-IN')} credited back` }
      },

      resetCardDemo: () => {
        set({
          virtualCards: [...INITIAL_DEMO_CARDS],
          cardTransactions: [...INITIAL_CARD_TRANSACTIONS],
          cardSubscriptions: [...INITIAL_CARD_SUBSCRIPTIONS],
          activeCardId: 'card_primary_01'
        })
        broadcastEvent('card:demo-reset', {})
      },

      // Objective 3: Self-Learning Actions
      submitFeedback: (feedback) => {
        const id = `fb_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`
        const record: FeedbackRecord = {
          ...feedback,
          id,
          submittedAt: new Date().toISOString(),
          isIncorporatedIntoDataset: false
        }
        
        set((s) => {
          const newRecords = [record, ...s.feedbackRecords]
          const isFraud = feedback.actualOutcome === 'FRAUD'
          const confirmedFraud = newRecords.filter(r => r.actualOutcome === 'FRAUD').length
          const confirmedLegit = newRecords.filter(r => r.actualOutcome === 'LEGITIMATE').length
          const unlearnedCount = newRecords.filter(r => !r.isIncorporatedIntoDataset).length

          return {
            feedbackRecords: newRecords,
            modelTrainingState: {
              ...s.modelTrainingState,
              confirmed_fraud_samples: confirmedFraud,
              confirmed_legit_samples: confirmedLegit,
              newly_learned_samples: unlearnedCount
            },
            systemMetrics: {
              ...s.systemMetrics,
              modelAccuracy: s.modelTrainingState.metrics.accuracy
            }
          }
        })

        broadcastEvent('feedback:submitted', record)
        return record
      },

      retrainModel: () => {
        const state = get()
        const unlearned = state.feedbackRecords.filter((f) => !f.isIncorporatedIntoDataset)
        const newlyLearnedCount = unlearned.length

        // Mark training state as training
        set((s) => ({
          modelTrainingState: {
            ...s.modelTrainingState,
            training_status: 'TRAINING'
          }
        }))

        // Execute retraining logic
        const { updatedState, newVersion } = executeModelRetraining(
          state.modelTrainingState,
          state.feedbackRecords
        )

        // Mark all feedback records as incorporated
        const updatedFeedback = state.feedbackRecords.map((f) => ({
          ...f,
          isIncorporatedIntoDataset: true,
          incorporatedIntoVersion: newVersion
        }))

        set((s) => ({
          modelTrainingState: updatedState,
          feedbackRecords: updatedFeedback,
          systemMetrics: {
            ...s.systemMetrics,
            modelAccuracy: updatedState.metrics.accuracy,
            lastModelRetrain: updatedState.last_retrained
          }
        }))

        broadcastEvent('model:retrained', { newVersion, metrics: updatedState.metrics, newlyLearnedCount })
        return { newVersion, newlyLearnedCount, metrics: updatedState.metrics }
      },

      togglePatternRule: (patternId, enableRule) => {
        set((s) => ({
          fraudPatterns: s.fraudPatterns.map((p) =>
            p.id === patternId
              ? {
                  ...p,
                  is_rule_created: enableRule,
                  status: enableRule ? ('MITIGATED' as const) : ('ACTIVE' as const)
                }
              : p
          )
        }))
        broadcastEvent('pattern:rule-toggled', { patternId, enableRule })
      },

      ingestGenericUpi: (payload) => {
        const state = get()
        const txnId = `TXN-GEN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
        const isFraud = Boolean(payload.isFraudAttempt || payload.amount > 100000 || payload.receiverVpa.includes('scam'))
        
        const riskScore = isFraud ? Math.floor(82 + Math.random() * 15) : Math.floor(8 + Math.random() * 20)
        const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW'
        const decision = riskScore >= 80 ? 'BLOCK' : riskScore >= 60 ? 'HOLD' : riskScore >= 40 ? 'VERIFY' : 'ALLOW'

        const genericTxn: SimulationTransaction = {
          id: `txn_${Date.now()}`,
          transactionId: txnId,
          senderName: 'Generic UPI Client',
          senderUpiId: payload.senderVpa,
          receiverName: payload.receiverName,
          receiverUpiId: payload.receiverVpa,
          receiverType: 'MERCHANT',
          amount: payload.amount,
          currency: 'INR',
          note: `Generic Ingestion via ${payload.sourceApp}`,
          source: 'INTENT',
          status: decision === 'BLOCK' ? 'BLOCKED' : 'SETTLED',
          riskScore,
          riskLevel,
          riskFactors: isFraud
            ? [
                { name: 'Provider Anomaly', score: 85, description: `Flagged suspicious activity from ${payload.sourceApp}`, importance: 'HIGH' },
                { name: 'Velocity / Amount Drift', score: 78, description: `Elevated amount of ₹${payload.amount.toLocaleString('en-IN')}`, importance: 'CRITICAL' }
              ]
            : [
                { name: 'Verified Endpoint', score: 10, description: 'Source signature and payload valid', importance: 'LOW' }
              ],
          mlProbability: riskScore / 100,
          riskDecision: decision as any,
          deviceId: payload.deviceId || 'EXT-DEVICE-ID',
          deviceTrust: isFraud ? 25 : 92,
          location: { city: payload.city || 'Bengaluru', country: 'India' },
          timestamps: {
            created: new Date().toISOString(),
            settled: decision !== 'BLOCK' ? new Date().toISOString() : undefined,
            blocked: decision === 'BLOCK' ? new Date().toISOString() : undefined
          }
        }

        // Update provider metrics
        const updatedProviders = state.upiProviders.map((prov) => {
          if (
            prov.app_name.toLowerCase().includes(payload.sourceApp.toLowerCase()) ||
            prov.app_code.toLowerCase() === payload.sourceApp.toLowerCase() ||
            prov.id.toLowerCase() === payload.sourceApp.toLowerCase()
          ) {
            return {
              ...prov,
              transactions_processed: prov.transactions_processed + 1,
              fraud_detected: isFraud ? prov.fraud_detected + 1 : prov.fraud_detected,
              legitimate_count: !isFraud ? prov.legitimate_count + 1 : prov.legitimate_count,
              last_transaction_at: new Date().toISOString()
            }
          }
          return prov
        })

        // Create alert if blocked or flagged
        const newAlert = isFraud
          ? {
              id: `alt_${Date.now()}`,
              alertId: `ALT-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
              severity: 'CRITICAL' as const,
              title: `External UPI Fraud Blocked: ${payload.sourceApp}`,
              description: `Generic ingestion intercepted suspicious txn of ₹${payload.amount.toLocaleString('en-IN')} to ${payload.receiverVpa}`,
              transactionId: txnId,
              amount: payload.amount,
              userId: payload.senderVpa,
              createdAt: new Date().toISOString(),
              status: 'OPEN' as const
            }
          : null

        set((s) => ({
          transactions: [genericTxn, ...s.transactions],
          upiProviders: updatedProviders,
          alerts: newAlert ? [newAlert, ...s.alerts] : s.alerts,
          systemMetrics: {
            ...s.systemMetrics,
            transactions_processed: s.systemMetrics.transactions_processed + 1,
            fraud_checks_completed: s.systemMetrics.fraud_checks_completed + 1
          }
        }))

        broadcastEvent('upi:ingested', { txnId, sourceApp: payload.sourceApp, riskScore, decision })
        return { transactionId: txnId, riskScore, riskLevel, decision }
      },

      updateSystemMetrics: (metrics) => {
        set((s) => ({
          systemMetrics: { ...s.systemMetrics, ...metrics }
        }))
        broadcastEvent('system:metrics-updated', metrics)
      },

      resetDemoEnvironment: () => {
        set({
          accounts: { ...INITIAL_DEMO_ACCOUNTS },
          activePaymentRequest: null,
          transactions: [...INITIAL_TRANSACTIONS],
          alerts: [...INITIAL_ALERTS],
          majorPurchases: [...INITIAL_MAJOR_PURCHASES],
          cases: [...INITIAL_CASES],
          incomingRequests: [...INITIAL_INCOMING_REQUESTS],
          virtualCards: [...INITIAL_DEMO_CARDS],
          cardTransactions: [...INITIAL_CARD_TRANSACTIONS],
          cardSubscriptions: [...INITIAL_CARD_SUBSCRIPTIONS],
          activeCardId: 'card_primary_01',
          feedbackRecords: [...INITIAL_FEEDBACK_RECORDS],
          modelTrainingState: {
            active_version: 'v2.4.1',
            last_retrained: '2026-09-24T18:30:00Z',
            dataset_samples: 1420500,
            confirmed_fraud_samples: 24820,
            confirmed_legit_samples: 1395680,
            newly_learned_samples: 1,
            training_status: 'IDLE',
            metrics: {
              accuracy: 99.4,
              precision: 98.8,
              recall: 97.9,
              f1_score: 98.3,
              roc_auc: 0.992,
              false_positive_rate: 0.012
            },
            versions: [...MODEL_PERFORMANCE_METRICS.versions]
          },
          fraudPatterns: [...INITIAL_FRAUD_PATTERNS],
          upiProviders: [...INITIAL_UPI_PROVIDERS],
          systemMetrics: { ...INITIAL_SYSTEM_METRICS },
          activeScenario: null,
          scenarioParams: {},
          currentOtpChallenge: null
        })
        broadcastEvent('demo:reset', {})
      }
    }),
    {
      name: 'upiguard_ai_store',
      partialize: (state) => ({
        accounts: state.accounts,
        activeUserUpi: state.activeUserUpi,
        activeMerchantUpi: state.activeMerchantUpi,
        transactions: state.transactions,
        expenses: state.expenses,
        alerts: state.alerts,
        majorPurchases: state.majorPurchases,
        cases: state.cases,
        incomingRequests: state.incomingRequests,
        activePaymentRequest: state.activePaymentRequest,
        virtualCards: state.virtualCards,
        cardTransactions: state.cardTransactions,
        cardSubscriptions: state.cardSubscriptions,
        activeCardId: state.activeCardId,
        feedbackRecords: state.feedbackRecords,
        modelTrainingState: state.modelTrainingState,
        fraudPatterns: state.fraudPatterns,
        upiProviders: state.upiProviders,
        systemMetrics: state.systemMetrics
      })
    }
  )
)

if (typeof window !== 'undefined') {
  // Ensure existing stored demo account has at least ₹50,00,000 balance and Objective 3 structures
  setTimeout(() => {
    try {
      const state = useUPIGuardStore.getState()
      const anjan = state.accounts['anjan@upiguard']
      const needsBalanceUpgrade = anjan && anjan.balance < 10000000
      const needsNotificationsInit = !state.notifications || state.notifications.length === 0
      const needsExpensesInit = !state.expenses || state.expenses.length === 0
      const needsCardInit = !state.virtualCards || state.virtualCards.length === 0
      const needsFeedbackInit = !state.feedbackRecords || state.feedbackRecords.length === 0
      const needsModelInit = !state.modelTrainingState || !state.modelTrainingState.active_version
      const needsPatternInit = !state.fraudPatterns || state.fraudPatterns.length === 0
      const needsProviderInit = !state.upiProviders || state.upiProviders.length === 0
      const needsMetricsInit = !state.systemMetrics

      if (
        needsBalanceUpgrade ||
        needsNotificationsInit ||
        needsExpensesInit ||
        needsCardInit ||
        needsFeedbackInit ||
        needsModelInit ||
        needsPatternInit ||
        needsProviderInit ||
        needsMetricsInit
      ) {
        useUPIGuardStore.setState({
          accounts: {
            ...state.accounts,
            'anjan@upiguard': {
              ...(anjan || INITIAL_DEMO_ACCOUNTS['anjan@upiguard']),
              balance: 10000000 // 1 Crore INR
            }
          },
          notifications: needsNotificationsInit ? [...INITIAL_APP_NOTIFICATIONS] : state.notifications,
          expenses: needsExpensesInit ? [...INITIAL_APP_EXPENSES] : state.expenses,
          virtualCards: needsCardInit ? [...INITIAL_DEMO_CARDS] : state.virtualCards,
          cardTransactions: state.cardTransactions && state.cardTransactions.length > 0 ? state.cardTransactions : [...INITIAL_CARD_TRANSACTIONS],
          cardSubscriptions: state.cardSubscriptions && state.cardSubscriptions.length > 0 ? state.cardSubscriptions : [...INITIAL_CARD_SUBSCRIPTIONS],
          activeCardId: state.activeCardId || 'card_primary_01',
          feedbackRecords: needsFeedbackInit ? [...INITIAL_FEEDBACK_RECORDS] : state.feedbackRecords,
          modelTrainingState: needsModelInit
            ? {
                active_version: 'v2.4.1',
                last_retrained: '2026-09-24T18:30:00Z',
                dataset_samples: 1420500,
                confirmed_fraud_samples: 24820,
                confirmed_legit_samples: 1395680,
                newly_learned_samples: 1,
                training_status: 'IDLE',
                metrics: {
                  accuracy: 99.4,
                  precision: 98.8,
                  recall: 97.9,
                  f1_score: 98.3,
                  roc_auc: 0.992,
                  false_positive_rate: 0.012
                },
                versions: [...MODEL_PERFORMANCE_METRICS.versions]
              }
            : state.modelTrainingState,
          fraudPatterns: needsPatternInit ? [...INITIAL_FRAUD_PATTERNS] : state.fraudPatterns,
          upiProviders: needsProviderInit ? [...INITIAL_UPI_PROVIDERS] : state.upiProviders,
          systemMetrics: needsMetricsInit ? { ...INITIAL_SYSTEM_METRICS } : state.systemMetrics
        })
      }
    } catch (e) {
      console.warn('Failed to auto-upgrade demo state', e)
    }
  }, 100)

  const channel = getBroadcastChannel()
  if (channel) {
    channel.onmessage = (event) => {
      const { type, payload } = event.data || {}
      // Sync store state when another tab modifies demo data
      if (
        type === 'payment:settled' ||
        type === 'payment:blocked' ||
        type === 'demo:reset' ||
        type === 'qr:generated' ||
        type === 'qr:cleared' ||
        type === 'majorPurchase:created' ||
        type === 'incoming:accepted' ||
        type === 'incoming:reported' ||
        type === 'admin:case-created' ||
        type === 'notification:created' ||
        type?.startsWith('card:') ||
        type === 'balance:updated' ||
        type === 'feedback:submitted' ||
        type === 'model:retrained' ||
        type === 'pattern:rule-toggled' ||
        type === 'upi:ingested' ||
        type === 'system:metrics-updated'
      ) {
        const stored = localStorage.getItem('upiguard_ai_store')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.state) {
              useUPIGuardStore.setState({
                accounts: parsed.state.accounts || INITIAL_DEMO_ACCOUNTS,
                transactions: parsed.state.transactions || INITIAL_TRANSACTIONS,
                alerts: parsed.state.alerts || INITIAL_ALERTS,
                notifications: parsed.state.notifications || INITIAL_APP_NOTIFICATIONS,
                majorPurchases: parsed.state.majorPurchases || INITIAL_MAJOR_PURCHASES,
                cases: parsed.state.cases || INITIAL_CASES,
                incomingRequests: parsed.state.incomingRequests || INITIAL_INCOMING_REQUESTS,
                activePaymentRequest: parsed.state.activePaymentRequest || null,
                virtualCards: parsed.state.virtualCards || INITIAL_DEMO_CARDS,
                cardTransactions: parsed.state.cardTransactions || INITIAL_CARD_TRANSACTIONS,
                cardSubscriptions: parsed.state.cardSubscriptions || INITIAL_CARD_SUBSCRIPTIONS,
                activeCardId: parsed.state.activeCardId || 'card_primary_01',
                feedbackRecords: parsed.state.feedbackRecords || INITIAL_FEEDBACK_RECORDS,
                modelTrainingState: parsed.state.modelTrainingState || undefined,
                fraudPatterns: parsed.state.fraudPatterns || INITIAL_FRAUD_PATTERNS,
                upiProviders: parsed.state.upiProviders || INITIAL_UPI_PROVIDERS,
                systemMetrics: parsed.state.systemMetrics || INITIAL_SYSTEM_METRICS
              })
            }
          } catch (e) {
            console.error('Failed to sync UPIGuard storage', e)
          }
        }
      }
    }
  }
}
