import { NextRequest, NextResponse } from 'next/server'
import { INITIAL_DEMO_CARDS } from '@/lib/upiguard-store'

let inMemoryCards = [...INITIAL_DEMO_CARDS]

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: inMemoryCards.filter((c) => c.status !== 'DELETED')
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const lastFour = Math.floor(1000 + Math.random() * 9000).toString()
    const newCard = {
      cardId: `card_${Date.now()}`,
      userId: body.userId || 'anjan@upiguard',
      cardType: body.cardType || 'VIRTUAL_CREDIT',
      nickname: body.nickname || 'Simulated Card',
      theme: body.theme || 'Midnight',
      purpose: body.purpose || 'General Spending',
      displayNumber: `VG-DEMO-${lastFour}`,
      maskedNumber: `•••• •••• •••• ${lastFour}`,
      syntheticToken: `VG-SEC-${lastFour}-DEMO`,
      expiryMonth: '12',
      expiryYear: '30',
      demoCvv: Math.floor(100 + Math.random() * 900).toString(),
      status: 'ACTIVE' as const,
      creditLimit: Number(body.creditLimit) || 100000,
      usedCredit: 0,
      availableCredit: Number(body.creditLimit) || 100000,
      dailyLimit: Number(body.dailyLimit) || 25000,
      monthlyLimit: Number(body.monthlyLimit) || 50000,
      onlineLimit: Number(body.onlineLimit) || 25000,
      contactlessLimit: Number(body.contactlessLimit) || 5000,
      locationProtection: body.locationProtection ?? true,
      deviceProtection: body.deviceProtection ?? true,
      aiFraudProtection: body.aiFraudProtection ?? true,
      transactionAlerts: body.transactionAlerts ?? true,
      authenticationRequired: body.authenticationRequired ?? true,
      otpRequired: body.otpRequired ?? true,
      autoFreezeOnCriticalRisk: body.autoFreezeOnCriticalRisk ?? false,
      travelMode: body.travelMode ?? false,
      homeLocation: 'Hubballi',
      allowedLocations: ['Hubballi', 'Dharwad', 'Bengaluru'],
      blockedLocations: ['International Suspicious'],
      allowedCities: ['Hubballi', 'Dharwad', 'Bengaluru'],
      blockedCities: ['Unknown Foreign Node'],
      allowedCategories: ['Electronics', 'Shopping', 'Travel', 'Food', 'Subscriptions', 'Automotive', 'Dining'],
      blockedCategories: ['Gambling / Risky Betting', 'Anonymous Crypto'],
      categoryLimits: {
        Shopping: 35000,
        Travel: 25000,
        Dining: 10000,
        Electronics: 80000
      },
      securityScore: 94,
      riskScore: 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    inMemoryCards.push(newCard)
    return NextResponse.json({ success: true, data: newCard }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}
