import { NextRequest, NextResponse } from 'next/server'
import { INITIAL_DEMO_CARDS } from '@/lib/upiguard-store'

let inMemoryCards = [...INITIAL_DEMO_CARDS]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = inMemoryCards.find((c) => c.cardId === id)
  if (!card) {
    return NextResponse.json({ success: false, message: 'Card not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: card })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = inMemoryCards.findIndex((c) => c.cardId === id)
  if (idx === -1) {
    return NextResponse.json({ success: false, message: 'Card not found' }, { status: 404 })
  }
  const body = await req.json()
  inMemoryCards[idx] = {
    ...inMemoryCards[idx],
    ...body,
    updatedAt: new Date().toISOString()
  }
  return NextResponse.json({ success: true, data: inMemoryCards[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = inMemoryCards.findIndex((c) => c.cardId === id)
  if (idx === -1) {
    return NextResponse.json({ success: false, message: 'Card not found' }, { status: 404 })
  }
  inMemoryCards[idx].status = 'DELETED'
  return NextResponse.json({ success: true, message: 'Simulated card revoked' })
}
