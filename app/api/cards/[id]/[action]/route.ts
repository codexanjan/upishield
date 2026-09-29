import { NextRequest, NextResponse } from 'next/server'
import { INITIAL_DEMO_CARDS, INITIAL_CARD_TRANSACTIONS } from '@/lib/upiguard-store'

let inMemoryCards = [...INITIAL_DEMO_CARDS]
let inMemoryTxns = [...INITIAL_CARD_TRANSACTIONS]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id: cardId, action: rawAction } = await params
  const action = rawAction.toLowerCase()

  const cardIdx = inMemoryCards.findIndex((c) => c.cardId === cardId)
  if (cardIdx === -1) {
    return NextResponse.json({ success: false, message: 'Card not found' }, { status: 404 })
  }

  const card = inMemoryCards[cardIdx]

  if (action === 'freeze') {
    card.status = 'FROZEN'
    card.frozenAt = new Date().toISOString()
    return NextResponse.json({ success: true, message: 'Card frozen', data: card })
  }

  if (action === 'unfreeze') {
    card.status = 'ACTIVE'
    card.frozenAt = undefined
    return NextResponse.json({ success: true, message: 'Card unfrozen', data: card })
  }

  if (action === 'regenerate') {
    const newLast4 = Math.floor(1000 + Math.random() * 9000).toString()
    card.displayNumber = `VG-DEMO-${newLast4}`
    card.maskedNumber = `•••• •••• •••• ${newLast4}`
    card.syntheticToken = `VG-SEC-${newLast4}-DEMO`
    card.demoCvv = Math.floor(100 + Math.random() * 900).toString()
    card.updatedAt = new Date().toISOString()
    return NextResponse.json({
      success: true,
      message: 'Card regenerated with new synthetic credentials',
      data: card
    })
  }

  if (action === 'payments') {
    try {
      const body = await req.json()
      const amount = Number(body.amount) || 0

      if (card.status === 'FROZEN') {
        return NextResponse.json(
          { success: false, message: 'CARD FROZEN: All simulated card transactions are blocked.' },
          { status: 403 }
        )
      }

      if (amount > card.availableCredit) {
        return NextResponse.json(
          { success: false, message: 'INSUFFICIENT AVAILABLE CREDIT' },
          { status: 400 }
        )
      }

      const txId = `CTXN-${Date.now().toString().slice(-6)}`
      const isLarge = amount >= 50000
      const isSuspicious = body.merchantName?.includes('Unknown') || body.location?.city?.includes('Mumbai')

      const riskScore = isSuspicious ? 88 : isLarge ? 45 : 15
      const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW'

      // Deduct credit
      card.usedCredit += amount
      card.availableCredit -= amount

      const newTx: any = {
        transactionId: txId,
        cardId: card.cardId,
        userId: card.userId,
        merchantId: body.merchantId || 'merch_demo',
        merchantName: body.merchantName || 'Demo Merchant',
        amount,
        currency: 'INR',
        category: body.category || 'Shopping',
        paymentChannel: body.paymentChannel || 'Online',
        location: body.location || { city: 'Hubballi', country: 'India' },
        device: body.device || 'Known Device',
        riskScore,
        riskLevel,
        status: 'APPROVED',
        decision: 'ALLOW',
        authorizationCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString()
      }

      inMemoryTxns.unshift(newTx)

      return NextResponse.json({
        success: true,
        transactionId: txId,
        status: 'APPROVED',
        riskScore,
        riskLevel,
        availableCredit: card.availableCredit,
        usedCredit: card.usedCredit,
        data: newTx
      })
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e.message }, { status: 400 })
    }
  }

  if (action === 'refunds') {
    const body = await req.json()
    const refundAmount = Number(body.amount) || 0
    card.availableCredit = Math.min(card.creditLimit, card.availableCredit + refundAmount)
    card.usedCredit = Math.max(0, card.usedCredit - refundAmount)

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${refundAmount} processed. Available credit restored.`,
      availableCredit: card.availableCredit,
      usedCredit: card.usedCredit
    })
  }

  return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
}
