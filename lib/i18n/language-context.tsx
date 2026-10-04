'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  LanguageOption
} from './translations'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, fallback?: string) => string
  languages: LanguageOption[]
  currentLanguageInfo: LanguageOption
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'upishield_selected_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
      if (saved && TRANSLATIONS[saved]) {
        setLanguageState(saved)
      }
    } catch {
      // Fallback to default
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en
    if (langDict[key]) {
      return langDict[key]
    }
    // Fallback to english
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key]
    }
    return fallback || key
  }

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageInfo
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    // Provide a safe fallback if used outside Provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string, fallback?: string) => TRANSLATIONS.en[key] || fallback || key,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageInfo: SUPPORTED_LANGUAGES[0]
    }
  }
  return context
}
