'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import VirtualCardsPage from '@/app/dashboard/cards/page'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function CardDetailsPageRoute() {
  const params = useParams()
  const id = params?.id as string | undefined
  const { setActiveCard, virtualCards } = useUPIGuardStore()

  useEffect(() => {
    if (id && virtualCards.some((c) => c.cardId === id)) {
      setActiveCard(id)
    }
  }, [id, virtualCards, setActiveCard])

  return <VirtualCardsPage />
}
